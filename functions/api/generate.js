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
        const stream = body.stream === true;

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

        if (stream) {
            requestBody.stream = true;
        }

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

        if (!llmRes.ok) {
            const llmText = await llmRes.text();
            const error = `OpenAI 兼容接口调用失败：${truncate(llmText, 600)}`;
            return stream ? ndjsonError(error) : json({ success: false, error }, 502);
        }

        if (stream) {
            return streamModelResponse(llmRes, { baseTitle, baseIcon, prompt });
        }

        const llmText = await llmRes.text();
        const llmData = safeJsonParse(llmText);
        const content = extractAssistantContent(llmData, llmText);
        const result = parseModelOutput(content || llmText);
        const html = cleanHtml(result.html || '');

        if (!isCompleteHtml(html)) {
            return json({
                success: false,
                error: '模型没有返回完整 HTML 文件，请换一种提示词再试。',
                debug: {
                    rawResponseLength: llmText.length,
                    contentLength: content.length,
                    rawResponsePreview: llmText.slice(0, 1200),
                    responseShape: describeResponseShape(llmData),
                    parsedKeys: result && typeof result === 'object' ? Object.keys(result) : []
                }
            }, 502);
        }

        return json(buildSuccessResult(result, html, { baseTitle, baseIcon, prompt }));
    } catch (error) {
        return json({ success: false, error: error.message || '生成失败' }, 500);
    }
}

function buildMessages({ action, prompt, sourceCode, baseTitle, baseIcon }) {
    const system = `你是儿童 HTML5 小游戏编程助手，目标用户是 6-12 岁儿童。你必须只返回 JSON 对象，不要返回 Markdown，不要解释。
JSON 格式：{"title":"游戏名","icon":"一个emoji","description":"一句中文简介","html":"完整HTML源码"}
HTML 要求：
1. 必须返回完整单文件 HTML，必须包含 <html>、<head>、<body>，建议包含 <!DOCTYPE html>。
2. CSS 和 JavaScript 必须全部内联，不能依赖外部库、CDN、远程图片或远程音频。
3. 游戏适合儿童，画面友好，操作简单，必须支持键盘或鼠标，尽量兼容触摸。
4. 页面内要有中文标题、玩法说明、开始/重新开始按钮。
5. 不要使用 alert 作为主要游戏流程；可以用页面元素显示状态。
6. 不能生成任何网络请求、登录、支付、隐私采集、跳转外站、下载文件、eval/new Function。
7. 如果是修改已有游戏，尽量保留原游戏玩法和结构，只根据提示词修改。
8. JavaScript 必须避免语法错误；变量名不要和浏览器保留对象冲突。
9. 如果你无法严格返回 JSON，可以直接返回完整 HTML，不要返回说明文字、差异补丁或片段。`;

    const userParts = [
        `任务类型：${action === 'modify' ? '修改已有游戏' : '新建游戏'}`,
        `默认游戏名：${baseTitle}`,
        `默认图标：${baseIcon}`,
        `用户提示词：${prompt}`
    ];

    if (action === 'modify' && sourceCode) {
        userParts.push(`下面是当前游戏的完整源码，请在它的基础上修改，并返回修改后的完整 HTML：\n${sourceCode}`);
    }

    return [
        { role: 'system', content: system },
        { role: 'user', content: userParts.join('\n\n') }
    ];
}

function streamModelResponse(llmRes, meta) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = '';
    let rawContent = '';
    let buffer = '';

    const readable = new ReadableStream({
        async start(controller) {
            const send = (event) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
            send({ type: 'status', message: '已连接模型，正在等待输出...' });

            try {
                const reader = llmRes.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    rawContent += chunk;
                    buffer += chunk;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const rawLine of lines) {
                        const line = rawLine.trim();
                        if (!line) continue;

                        if (!line.startsWith('data:')) {
                            continue;
                        }

                        const data = line.slice(5).trim();
                        if (!data || data === '[DONE]') continue;
                        const parsed = safeJsonParse(data);
                        const delta = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.message?.content || '';
                        if (delta) {
                            fullContent += delta;
                            send({ type: 'delta', text: delta });
                        }
                    }
                }

                if (!fullContent.trim()) {
                    const fallbackContent = extractContentFromNonStreamResponse(rawContent);
                    if (fallbackContent) {
                        fullContent = fallbackContent;
                        send({ type: 'delta', text: fallbackContent });
                    }
                }

                const result = parseModelOutput(fullContent);
                const html = cleanHtml(result.html || '');
                if (!isCompleteHtml(html)) {
                    send({
                        type: 'error',
                        error: '模型输出完成，但没有得到完整 HTML 文件。已收到输出 ' + fullContent.length + ' 字，请让模型只返回完整 HTML。'
                    });
                    controller.close();
                    return;
                }

                send({ type: 'done', result: buildSuccessResult(result, html, meta) });
                controller.close();
            } catch (error) {
                send({ type: 'error', error: error.message || '读取模型流式输出失败' });
                controller.close();
            }
        }
    });

    return new Response(readable, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function extractContentFromNonStreamResponse(rawContent) {
    const text = String(rawContent || '').trim();
    if (!text) return '';

    const parsed = safeJsonParse(text);
    const content = extractAssistantContent(parsed, text);
    if (content) return String(content);

    const html = extractHtml(text);
    if (html) return html;

    return '';
}

function extractAssistantContent(parsed, rawText = '') {
    if (!parsed || typeof parsed !== 'object') {
        const html = extractHtml(rawText);
        return html || '';
    }

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

    const deep = findDeepTextWithHtml(parsed);
    if (deep) return deep;

    const html = extractHtml(rawText);
    return html || '';
}

function flattenTextCandidate(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        return value.map(flattenTextCandidate).filter(Boolean).join('\n');
    }
    if (typeof value === 'object') {
        const nested = value.text || value.content || value.output_text || value.html || value.code;
        if (nested) return flattenTextCandidate(nested);
    }
    return '';
}

function findDeepTextWithHtml(value, depth = 0) {
    if (!value || depth > 5) return '';
    if (typeof value === 'string') {
        return extractHtml(value) ? value : '';
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findDeepTextWithHtml(item, depth + 1);
            if (found) return found;
        }
        return '';
    }
    if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
            const found = findDeepTextWithHtml(value[key], depth + 1);
            if (found) return found;
        }
    }
    return '';
}

function describeResponseShape(value, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 2) return typeof value;
    if (Array.isArray(value)) {
        return value.length ? [`Array(${value.length})`, describeResponseShape(value[0], depth + 1)] : ['Array(0)'];
    }
    const shape = {};
    for (const key of Object.keys(value).slice(0, 20)) {
        const child = value[key];
        shape[key] = child && typeof child === 'object' ? describeResponseShape(child, depth + 1) : typeof child;
    }
    return shape;
}

function buildSuccessResult(result, html, { baseTitle, baseIcon, prompt }) {
    return {
        success: true,
        title: sanitizeText(result.title || baseTitle, 30),
        icon: sanitizeText(result.icon || baseIcon || '🎮', 4),
        description: sanitizeText(result.description || `根据提示词生成：${prompt.slice(0, 80)}`, 120),
        html
    };
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

function ndjsonError(error, status = 502) {
    return new Response(JSON.stringify({ type: 'error', error }) + '\n', {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function safeJsonParse(text) {
    try { return JSON.parse(text); } catch { return null; }
}

function parseModelOutput(content) {
    const text = String(content || '').trim();

    const parsedResult = parseModelJson(text);
    if (parsedResult.html) return parsedResult;

    const rawHtml = extractHtml(text);
    if (rawHtml) return fallbackHtmlResult(rawHtml);

    const unescapedText = unescapeLikelyJsonString(text);
    const unescapedHtml = extractHtml(unescapedText);
    if (unescapedHtml) return fallbackHtmlResult(unescapedHtml);

    return parsedResult;
}

function parseModelJson(content) {
    const cleaned = String(content || '').trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

    const parsed = safeJsonParse(cleaned);
    if (parsed) return normalizeParsedResult(parsed);

    const match = findJsonObjectContainingHtml(cleaned);
    if (match) {
        const fallback = safeJsonParse(match);
        if (fallback) return normalizeParsedResult(fallback);
    }

    const html = extractHtml(cleaned);
    if (html) return fallbackHtmlResult(html);

    return {};
}

function findJsonObjectContainingHtml(text) {
    const content = String(text || '');
    const htmlKeyIndex = content.indexOf('"html"');
    if (htmlKeyIndex < 0) return '';
    const start = content.lastIndexOf('{', htmlKeyIndex);
    const end = content.lastIndexOf('}');
    if (start < 0 || end <= start) return '';
    return content.slice(start, end + 1);
}

function normalizeParsedResult(parsed) {
    if (!parsed || typeof parsed !== 'object') return {};
    let html = parsed.html || parsed.HTML || parsed.code || parsed.content || parsed.result || parsed.data || parsed.output || '';
    if (typeof html !== 'string') html = String(html || '');
    html = cleanHtml(unescapeLikelyJsonString(html));
    if (!html && typeof parsed.output === 'string') html = cleanHtml(unescapeLikelyJsonString(parsed.output));
    return {
        title: parsed.title || parsed.name || '编程小游戏',
        icon: parsed.icon || '🎮',
        description: parsed.description || parsed.desc || '这是一个由 VibeCoding 生成的小游戏。',
        html
    };
}

function fallbackHtmlResult(html) {
    return {
        title: '编程小游戏',
        icon: '🎮',
        description: '这是一个由 VibeCoding 生成的小游戏。',
        html
    };
}

function unescapeLikelyJsonString(value) {
    const text = String(value || '');
    if (!text.includes('\\n') && !text.includes('\\"') && !text.includes('\\/')) return text;
    const parsed = safeJsonParse(`"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    if (parsed) return parsed;
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\//g, '/');
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
    return unescapeLikelyJsonString(String(html || ''))
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
}

function isCompleteHtml(html) {
    return /<html[\s>]/i.test(html) && /<body[\s>]/i.test(html);
}

function sanitizeText(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function truncate(value, maxLength) {
    const text = String(value || '');
    return text.length > maxLength ? `${text.slice(0, maxLength)}\n...内容过长，已截断...` : text;
}
