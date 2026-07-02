const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const DEFAULT_COSTS = {
    ai_create_cost: 100,
    ai_edit_cost: 10
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
                owner: meta.owner || '',
                ownerName: meta.ownerName || meta.owner || '',
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
        const db = env.DB || env.YJH_DB || env.D1_DATABASE;
        if (!kv) return json({ success: false, error: '缺少 GAMES_KV 绑定，请在 Cloudflare Pages Functions 中绑定 KV 命名空间。' }, 500);
        if (!db) return json({ success: false, error: '缺少 Cloudflare D1 绑定。请把 D1 数据库绑定名设置为 DB。' }, 500);

        const body = await request.json();
        const action = String(body.action || '').trim();
        const session = await getSession(db, request, body);
        if (!session) return json({ success: false, error: '请先登录。' }, 401);

        if (action === 'trash' || action === 'restore') {
            return requireGameAdmin(session, () => updateTrashState(kv, db, body, action === 'trash'));
        }

        if (action === 'delete') {
            return requireGameAdmin(session, () => deleteGame(kv, db, body, session.user));
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
        const existing = await kv.get(`game:${id}`, { type: 'json' });
        const isBuiltinOverride = /^mod-/.test(id);
        const isCreate = !existing;

        if (session.user.role === 'member') {
            if (isBuiltinOverride) return json({ success: false, error: '会员不能修改首页内置榜单游戏。' }, 403);
            if (existing && existing.owner !== session.user.username) return json({ success: false, error: '只能编辑自己的 AI 编程作品。' }, 403);
            const settings = await getSettings(db);
            const cost = Number(settings[isCreate ? 'ai_create_cost' : 'ai_edit_cost'] || DEFAULT_COSTS[isCreate ? 'ai_create_cost' : 'ai_edit_cost']);
            const fresh = await db.prepare('SELECT points FROM users WHERE id = ?').bind(session.user.id).first();
            if (Number(fresh?.points || 0) < cost) return json({ success: false, error: `积分不足，本次${isCreate ? '新建' : '编辑'}需要 ${cost} 积分。` }, 400);
            await changePoints(db, session.user.id, -cost, isCreate ? 'AI 编程新建游戏' : 'AI 编程编辑游戏', isCreate ? 'ai_create' : 'ai_edit', id, { title });
        }

        const owner = existing?.owner || session.user.username;
        const ownerName = existing?.ownerName || session.user.display_name || session.user.username;
        const game = {
            id,
            title,
            icon,
            description,
            prompt,
            html: htmlCode,
            owner,
            ownerName,
            trashed: false,
            trashedAt: '',
            updatedAt: now
        };

        await kv.put(`game:${id}`, JSON.stringify(game), {
            metadata: { title, icon, description, owner, ownerName, updatedAt: now, trashed: false, trashedAt: '' }
        });

        if (session.user.role === 'member') {
            await db.prepare(`INSERT INTO member_cards (user_id, card_id, title, icon, description, url, recommended, recommended_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, '', ?)
                ON CONFLICT(user_id, card_id) DO UPDATE SET title = excluded.title, icon = excluded.icon, description = excluded.description, url = excluded.url, updated_at = excluded.updated_at`)
                .bind(session.user.id, id, title, icon, description, `/api/games?id=${encodeURIComponent(id)}&view=1`, now).run();
        }

        const freshUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user.id).first();
        return json({ success: true, game: summarizeGame(game), user: publicUser(freshUser) });
    } catch (error) {
        return json({ success: false, error: error.message || '保存游戏失败' }, 500);
    }
}

function requireGameAdmin(session, fn) {
    if (!['game_admin', 'system_admin'].includes(session.user.role)) return json({ success: false, error: '只有管理员可以操作。' }, 403);
    return fn();
}

async function getSession(db, request, body = {}) {
    const auth = request.headers.get('Authorization') || '';
    const token = String(body.token || auth.replace(/^Bearer\s+/i, '') || '').trim();
    if (!token) return null;
    const row = await db.prepare('SELECT s.token, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(token).first();
    if (!row || String(row.expires_at || '') < new Date().toISOString()) return null;
    return { token, user: row };
}

async function getSettings(db) {
    const result = await db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries((result.results || []).map(row => [row.key, row.value]));
}

async function changePoints(db, userId, delta, reason, refType = '', refId = '', meta = {}) {
    const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first();
    const next = Number(user?.points || 0) + Number(delta || 0);
    if (next < 0) throw new Error('积分不足。');
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET points = ?, updated_at = ? WHERE id = ?').bind(next, now, userId).run();
    await db.prepare('INSERT INTO point_logs (user_id, delta, reason, ref_type, ref_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(userId, Number(delta || 0), reason, refType || '', refId || '', JSON.stringify(meta || {}), now).run();
}

async function updateTrashState(kv, db, body, trashed) {
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
            owner: game.owner || '',
            ownerName: game.ownerName || game.owner || '',
            updatedAt: now,
            trashed,
            trashedAt: game.trashedAt || ''
        }
    });

    if (trashed) {
        const owner = sanitizeUsername(game.owner || '');
        if (owner) {
            const ownerUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(owner).first();
            if (ownerUser) {
                await db.prepare('UPDATE member_cards SET recommended = 0, recommended_at = \'\', updated_at = ? WHERE user_id = ? AND card_id = ?')
                    .bind(now, ownerUser.id, id).run();
            }
        }
    }

    return json({ success: true, game: summarizeGame(game) });
}

async function deleteGame(kv, db, body, user) {
    const id = sanitizeId(body.id || '');
    const password = String(body.password || '').trim();
    if (!id) return json({ success: false, error: '缺少游戏 ID' }, 400);
    if (!password) return json({ success: false, error: '管理员密码不能为空' }, 403);
    if (String(user.password || '') !== password) return json({ success: false, error: '管理员密码错误' }, 403);
    const stored = await kv.get(`game:${id}`, { type: 'json' });
    const owner = sanitizeUsername(stored?.owner || '');
    if (owner) {
        const ownerUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(owner).first();
        if (ownerUser) await db.prepare('DELETE FROM member_cards WHERE user_id = ? AND card_id = ?').bind(ownerUser.id, id).run();
    }
    await kv.delete(`game:${id}`);
    return json({ success: true, id });
}

function summarizeGame(game) {
    return {
        id: game.id,
        title: game.title || '编程小游戏',
        icon: game.icon || '🎮',
        description: game.description || '这是一个由 VibeCoding 生成的小游戏。',
        owner: game.owner || '',
        ownerName: game.ownerName || game.owner || '',
        updatedAt: game.updatedAt || '',
        trashed: Boolean(game.trashed),
        trashedAt: game.trashedAt || ''
    };
}

function publicUser(user) {
    return {
        username: user.username,
        role: user.role || 'member',
        displayName: user.display_name || user.username,
        points: Number(user.points || 0)
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

function sanitizeUsername(value) {
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9_@.\-]/g, '').slice(0, 80);
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
