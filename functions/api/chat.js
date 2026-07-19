import { resolveProvider } from './_provider.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const question = String(body.question || '').trim();
        const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

        if (!question) {
            return json({ success: false, error: '问题不能为空' }, 400);
        }

        const db = env.DB || env.YJH_DB || env.D1_DATABASE || null;
        const { apiKey, baseUrl, model, tokenParamName, maxTokens } = await resolveProvider(env, 'chat', db);

        if (!apiKey) {
            return json({ success: false, error: '缺少 AI API Key，请让系统管理员在"平台设置 → AI 供应商"里填写。' }, 500);
        }

        const messages = buildChatMessages(question, history);
        const requestBody = {
            model,
            messages,
            temperature: 0.5
        };
        requestBody[tokenParamName] = maxTokens;

        const llmRes = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const text = await llmRes.text();
        if (!llmRes.ok) {
            return json({ success: false, error: `AI 对话接口调用失败：${text.slice(0, 600)}` }, 502);
        }

        const data = safeJsonParse(text);
        const answer = extractAssistantContent(data, text).trim();
        if (!answer) {
            return json({
                success: false,
                error: 'AI 没有返回可显示的回答。',
                debug: {
                    rawResponseLength: text.length,
                    rawResponsePreview: text.slice(0, 800),
                    responseShape: describeResponseShape(data)
                }
            }, 502);
        }

        return json({ success: true, answer });
    } catch (error) {
        return json({ success: false, error: error.message || 'AI 对话失败' }, 500);
    }
}

function buildChatMessages(question, history) {
    const system = `你是景绘AI编程乐园里的儿童友好 AI 助手。
回答对象主要是小朋友、家长或老师。
要求：
1. 用简明中文回答，可以分步骤。
2. 适合儿童，不回答危险、隐私、违法、成人内容。
3. 如果是编程或游戏问题，尽量给出容易理解的解释和可执行建议。
4. 回答不要太长，优先 3-8 句话；必要时列清单。`;

    const messages = [{ role: 'system', content: system }];
    for (const item of history) {
        const role = item && item.role === 'assistant' ? 'assistant' : 'user';
        const content = String(item && item.content || '').trim();
        if (content) messages.push({ role, content: content.slice(0, 1000) });
    }
    messages.push({ role: 'user', content: question });
    return messages;
}

function normalizeBaseUrl(url) {
    return String(url || '').replace(/\/+$/, '');
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function extractAssistantContent(parsed, rawText = '') {
    if (!parsed || typeof parsed !== 'object') return String(rawText || '');
    const candidates = [
        parsed?.choices?.[0]?.message?.content,
        parsed?.choices?.[0]?.delta?.content,
        parsed?.choices?.[0]?.text,
        parsed?.output_text,
        parsed?.content,
        parsed?.text,
        parsed?.result,
        parsed?.data,
        parsed?.message,
        parsed?.answer,
        parsed?.response,
        parsed?.output
    ];
    for (const candidate of candidates) {
        const value = flattenTextCandidate(candidate);
        if (value) return value;
    }
    return '';
}

function flattenTextCandidate(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(flattenTextCandidate).filter(Boolean).join('\n');
    if (typeof value === 'object') {
        return flattenTextCandidate(value.text || value.content || value.output_text || value.answer || value.message);
    }
    return '';
}

function describeResponseShape(value, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 2) return typeof value;
    if (Array.isArray(value)) return value.length ? [`Array(${value.length})`, describeResponseShape(value[0], depth + 1)] : ['Array(0)'];
    const shape = {};
    for (const key of Object.keys(value).slice(0, 20)) {
        const child = value[key];
        shape[key] = child && typeof child === 'object' ? describeResponseShape(child, depth + 1) : typeof child;
    }
    return shape;
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
}
