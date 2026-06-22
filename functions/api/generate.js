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
        const content = llmData?.choices?.[0]?.message?.content || '';
        const result = parseModelJson(content);
        const html = cleanHtml(result.html || '');

        if (!isCompleteHtml(html)) {
            return json({ success: false, error: '模型没有返回完整 HTML 文件，请换一种提示词再试。' }, 502);
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
        userParts.push(`下面是当前游戏的源码。源码可能较长，我只提供关键部分和前后片段。请根据这些内容重建一个完整、可运行的单文件 HTML 游戏，并体现用户要求的修改。\n${compactSourceForModel(sourceCode)}`);
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
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const rawLine of lines) {
                        const line = rawLine.trim();
                        if (!line || !line.startsWith('data:')) continue;
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

                const result = parseModelJson(fullContent);
                const html = cleanHtml(result.html || '');
                if (!isCompleteHtml(html)) {
                    send({ type: 'error', error: '模型输出完成，但没有得到完整 HTML 文件。可以让模型“只返回完整 HTML 或 JSON”。' });
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

function buildSuccessResult(result, html, { baseTitle, baseIcon, prompt }) {
    return {
        success: true,
        title: sanitizeText(result.title || baseTitle, 30),
        icon: sanitizeText(result.icon || baseIcon || '🎮', 4),
        description: sanitizeText(result.description || `根据提示词生成：${prompt.slice(0, 80)}`, 120),
        html
    };
}

function compactSourceForModel(sourceCode) {
    const source = String(sourceCode || '');
    const maxLength = 42000;
    if (source.length <= maxLength) return source;

    const titleMatch = source.match(/<title[\s\S]*?<\/title>/i);
    const bodyStartMatch = source.match(/<body[\s\S]*?>[\s\S]{0,9000}/i);
    const scripts = [...source.matchAll(/<script[\s\S]*?<\/script>/gi)].map(match => match[0]);
    const styles = [...source.matchAll(/<style[\s\S]*?<\/style>/gi)].map(match => match[0]);

    const compactParts = [
        '<!DOCTYPE html>',
        '<html lang="zh-CN">',
        '<head>',
        titleMatch ? titleMatch[0] : '<title>编程小游戏</title>',
        styles.map((style, index) => `<!-- style ${index + 1}，已截断 -->\n${truncate(style, 9000)}`).join('\n'),
        '</head>',
        bodyStartMatch ? `<!-- body 开头片段 -->\n${bodyStartMatch[0]}` : '<body>',
        scripts.map((script, index) => `<!-- script ${index + 1}，已截断 -->\n${truncate(script, 14000)}`).join('\n'),
        '</body>\n</html>'
    ];

    return compactParts.join('\n\n').slice(0, maxLength);
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
