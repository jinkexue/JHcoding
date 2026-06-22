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
        const prompt = String(body.prompt || '').trim();
        const action = body.action === 'modify' ? 'modify' : 'new';
        const sourceCode = String(body.sourceCode || '');
        const baseTitle = String(body.baseTitle || '编程小游戏').trim();
        const baseIcon = String(body.baseIcon || '🎮').trim();

        if (!prompt) {
            return json({ success: false, error: '提示词不能为空' }, 400);
        }

        const apiKey = env.OPENAI_API_KEY;
        const baseUrl = normalizeBaseUrl(env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
        const model = env.OPENAI_MODEL || 'gpt-4o-mini';

        if (!apiKey) {
            return json({ success: false, error: '缺少 OPENAI_API_KEY 环境变量' }, 500);
        }

        const messages = buildMessages({ action, prompt, sourceCode, baseTitle, baseIcon });
        const requestBody = {
            model,
            messages,
            temperature: 0.35
        };

        if (String(env.OPENAI_USE_RESPONSE_FORMAT || '').toLowerCase() === 'true') {
            requestBody.response_format = { type: 'json_object' };
        }

        const llmRes = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const llmText = await llmRes.text();
        if (!llmRes.ok) {
            return json({ success: false, error: `OpenAI 兼容接口调用失败：${truncate(llmText, 600)}` }, 502);
        }

        const llmData = safeJsonParse(llmText);
        const content = llmData?.choices?.[0]?.message?.content || '';
        const result = parseModelJson(content);
        const html = cleanHtml(result.html || '');

        if (!isCompleteHtml(html)) {
            return json({ success: false, error: '模型没有返回完整 HTML 文件，请换一种提示词再试。' }, 502);
        }

        return json({
            success: true,
            title: sanitizeText(result.title || baseTitle, 30),
            icon: sanitizeText(result.icon || baseIcon || '🎮', 4),
            description: sanitizeText(result.description || `根据提示词生成：${prompt.slice(0, 80)}`, 120),
            html
        });
    } catch (error) {
        return json({ success: false, error: error.message || '生成失败' }, 500);
    }
}

function buildMessages({ action, prompt, sourceCode, baseTitle, baseIcon }) {
    const system = `你是儿童 HTML5 小游戏编程助手，目标用户是 6-12 岁儿童。你必须只返回 JSON 对象，不要返回 Markdown，不要解释。
JSON 格式：{"title":"游戏名","icon":"一个emoji","description":"一句中文简介","html":"完整HTML源码"}
HTML 要求：
1. 必须是完整单文件 HTML，包含 <!DOCTYPE html>、<html>、<head>、<body>。
2. CSS 和 JavaScript 必须全部内联，不能依赖外部库、CDN、远程图片或远程音频。
3. 游戏适合儿童，画面友好，操作简单，必须支持键盘或鼠标，尽量兼容触摸。
4. 页面内要有中文标题、玩法说明、开始/重新开始按钮。
5. 不要使用 alert 作为主要游戏流程；可以用页面元素显示状态。
6. 不能生成任何网络请求、登录、支付、隐私采集、跳转外站、下载文件、eval/new Function。
7. 如果是修改已有游戏，尽量保留原游戏玩法和结构，只根据提示词修改。
8. JavaScript 必须避免语法错误；变量名不要和浏览器保留对象冲突。`;

    const userParts = [
        `任务类型：${action === 'modify' ? '修改已有游戏' : '新建游戏'}`,
        `默认游戏名：${baseTitle}`,
        `默认图标：${baseIcon}`,
        `用户提示词：${prompt}`
    ];

    if (action === 'modify' && sourceCode) {
        userParts.push(`下面是当前游戏的完整源码，请在它的基础上修改，并返回修改后的完整 HTML：\n${truncate(sourceCode, 120000)}`);
    }

    return [
        { role: 'system', content: system },
        { role: 'user', content: userParts.join('\n\n') }
    ];
}

function normalizeBaseUrl(url) {
    return String(url || '').replace(/\/+$/, '');
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}

function safeJsonParse(text) {
    try { return JSON.parse(text); } catch { return null; }
}

function parseModelJson(content) {
    const cleaned = String(content || '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

    const parsed = safeJsonParse(cleaned);
    if (parsed) return parsed;

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        const fallback = safeJsonParse(match[0]);
        if (fallback) return fallback;
    }

    const html = extractHtml(cleaned);
    if (html) {
        return {
            title: '编程小游戏',
            icon: '🎮',
            description: '这是一个由 VibeCoding 生成的小游戏。',
            html
        };
    }

    return {};
}

function extractHtml(content) {
    const text = String(content || '').trim()
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    const doctypeIndex = text.toLowerCase().indexOf('<!doctype html>');
    if (doctypeIndex >= 0) return text.slice(doctypeIndex);
    const htmlIndex = text.toLowerCase().indexOf('<html');
    if (htmlIndex >= 0) return '<!DOCTYPE html>\n' + text.slice(htmlIndex);
    return '';
}

function cleanHtml(html) {
    return String(html || '')
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
}

function isCompleteHtml(html) {
    return /<!doctype html>/i.test(html) && /<html[\s>]/i.test(html) && /<body[\s>]/i.test(html) && /<script[\s>]/i.test(html);
}

function sanitizeText(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function truncate(value, maxLength) {
    const text = String(value || '');
    return text.length > maxLength ? `${text.slice(0, maxLength)}\n...内容过长，已截断...` : text;
}
