const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const kv = env.GAMES_KV;
        if (!kv) {
            return json({ games: [], warning: '未绑定 GAMES_KV，编程作品暂不能持久保存。' });
        }

        const url = new URL(request.url);
        const id = sanitizeId(url.searchParams.get('id') || '');
        const view = url.searchParams.get('view') === '1';

        if (id) {
            const stored = await kv.get(`game:${id}`, { type: 'json' });
            if (!stored) {
                return view ? html('<h1>游戏不存在</h1>', 404) : json({ success: false, error: '游戏不存在' }, 404);
            }
            if (view) {
                return html(stored.html || '<h1>游戏内容为空</h1>');
            }
            return json({ success: true, game: stored });
        }

        const list = await kv.list({ prefix: 'game:' });
        const games = (list.keys || []).map(item => {
            const meta = item.metadata || {};
            return {
                id: String(item.name || '').replace(/^game:/, ''),
                title: meta.title || '编程小游戏',
                icon: meta.icon || '🎮',
                description: meta.description || '这是一个由 VibeCoding 生成的小游戏。',
                updatedAt: meta.updatedAt || '',
                trashed: Boolean(meta.trashed),
                trashedAt: meta.trashedAt || ''
            };
        }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

        return json({ success: true, games });
    } catch (error) {
        return json({ success: false, error: error.message || '读取游戏失败' }, 500);
    }
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const kv = env.GAMES_KV;
        if (!kv) {
            return json({ success: false, error: '缺少 GAMES_KV 绑定，请在 Cloudflare Pages Functions 中绑定 KV 命名空间。' }, 500);
        }

        const body = await request.json();
        const action = String(body.action || '').trim();

        if (action === 'trash' || action === 'restore') {
            return updateTrashState(kv, body, action === 'trash');
        }

        if (action === 'delete') {
            return deleteGame(kv, body);
        }

        const now = new Date().toISOString();
        const title = sanitizeText(body.title || '编程小游戏', 30);
        const icon = sanitizeText(body.icon || '🎮', 4);
        const description = sanitizeText(body.description || '这是一个由 VibeCoding 生成的小游戏。', 120);
        const prompt = sanitizeText(body.prompt || '', 300);
        const htmlCode = String(body.html || '').trim();

        if (!isCompleteHtml(htmlCode)) {
            return json({ success: false, error: '保存失败：内容不是完整 HTML 游戏。' }, 400);
        }

        const id = sanitizeId(body.id || '') || createId(title);
        const game = {
            id,
            title,
            icon,
            description,
            prompt,
            html: htmlCode,
            trashed: false,
            trashedAt: '',
            updatedAt: now
        };

        await kv.put(`game:${id}`, JSON.stringify(game), {
            metadata: { title, icon, description, updatedAt: now, trashed: false, trashedAt: '' }
        });

        return json({ success: true, game: { id, title, icon, description, updatedAt: now, trashed: false } });
    } catch (error) {
        return json({ success: false, error: error.message || '保存游戏失败' }, 500);
    }
}

async function updateTrashState(kv, body, trashed) {
    const id = sanitizeId(body.id || '');
    if (!id) return json({ success: false, error: '缺少游戏 ID' }, 400);

    const stored = await kv.get(`game:${id}`, { type: 'json' });
    if (!stored) return json({ success: false, error: '游戏不存在' }, 404);

    const now = new Date().toISOString();
    const game = {
        ...stored,
        trashed,
        trashedAt: trashed ? now : '',
        updatedAt: now
    };

    await kv.put(`game:${id}`, JSON.stringify(game), {
        metadata: {
            title: game.title || '编程小游戏',
            icon: game.icon || '🎮',
            description: game.description || '这是一个由 VibeCoding 生成的小游戏。',
            updatedAt: now,
            trashed,
            trashedAt: game.trashedAt || ''
        }
    });

    return json({ success: true, game: summarizeGame(game) });
}

async function deleteGame(kv, body) {
    const id = sanitizeId(body.id || '');
    const password = String(body.password || '').trim();
    if (!id) return json({ success: false, error: '缺少游戏 ID' }, 400);
    if (password !== '311051') return json({ success: false, error: '删除密码错误' }, 403);

    await kv.delete(`game:${id}`);
    return json({ success: true, id });
}

function summarizeGame(game) {
    return {
        id: game.id,
        title: game.title || '编程小游戏',
        icon: game.icon || '🎮',
        description: game.description || '这是一个由 VibeCoding 生成的小游戏。',
        updatedAt: game.updatedAt || '',
        trashed: Boolean(game.trashed),
        trashedAt: game.trashedAt || ''
    };
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

function html(content, status = 200) {
    return new Response(String(content || ''), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function isCompleteHtml(value) {
    return /<!doctype html>/i.test(value) && /<html[\s>]/i.test(value) && /<body[\s>]/i.test(value);
}

function sanitizeText(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function sanitizeId(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

function createId(title) {
    const slug = sanitizeId(pinyinLike(title)) || 'vibe-game';
    return `${slug}-${Date.now().toString(36)}`;
}

function pinyinLike(value) {
    return String(value || '')
        .replace(/编程小游戏/g, 'vibe-game')
        .replace(/游戏/g, 'game')
        .replace(/打地鼠/g, 'whack-mole')
        .replace(/赛车/g, 'racing')
        .replace(/射击/g, 'shooting')
        .replace(/校园/g, 'campus')
        .replace(/俄罗斯方块/g, 'tetris')
        .replace(/贪吃蛇/g, 'snake')
        .replace(/英语/g, 'english');
}
