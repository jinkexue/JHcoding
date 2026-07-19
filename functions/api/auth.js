import { resolveProvider } from './_provider.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const GAME_ADMIN_USERNAME = 'yjh';
const GAME_ADMIN_PASSWORD = '150113';
const SYSTEM_ADMIN_USERNAME = 'yqcw@qq.com';
const SYSTEM_ADMIN_PASSWORD = '123456';
const FEATURED_OWNER_USERNAME = 'yjh@sivani.net';
const FEATURED_OWNER_PASSWORD = '123456';
const FEATURED_OWNER_DISPLAY = 'yjh@sivani.net';
const MAX_MEMBER_CARDS = 3;

const DEFAULT_SETTINGS = {
    signup_bonus_points: '200',
    ai_create_cost: '100',
    ai_edit_cost: '10',
    leaderboard_play_cost: '2',
    leaderboard_owner_reward: '1',
    recharge_min_yuan: '10',
    recharge_points_per_10_yuan: '100',
    register_ip_limit_per_hour: '3',
    invite_required: '1',
    wechat_account_name: '',
    wechat_qr_image: '',
    recharge_notice: '充值请添加系统管理员设置的微信账户，10 元起充。',
    // AI 供应商配置（管理员在后台设置，用于替代环境变量）
    ai_api_key: '',
    ai_base_url: '',
    ai_model: '',
    ai_chat_model: '',
    ai_token_param: '',
    ai_max_tokens: '',
    ai_chat_max_tokens: '',
    ai_use_response_format: ''
};

// 敏感字段：不会通过 publicSettings 暴露给普通用户
const SENSITIVE_SETTING_KEYS = new Set([
    'ai_api_key',
    'ai_base_url',
    'ai_model',
    'ai_chat_model',
    'ai_token_param',
    'ai_max_tokens',
    'ai_chat_max_tokens',
    'ai_use_response_format'
]);

const FEATURED_GAMES = [
    { cardId: 'go-game', title: '围棋对弈', icon: '⚫', url: 'go-game.html', description: '经典围棋游戏！输入密码进入房间，支持在线对战。可创建房间、观战、限时落子、保存棋局回放。' },
    { cardId: 'whack-a-mole', title: '打地鼠', icon: '🐹', url: 'whack-a-mole.html', description: '经典的打地鼠游戏！考验你的反应速度，看看能在10秒内打到多少只地鼠。' },
    { cardId: 'racing-game', title: '极速躲避赛车', icon: '🏎️', url: 'racing-game.html', description: '使用方向键控制赛车躲避障碍物，坚持越久得分越高，难度会逐渐增加。' },
    { cardId: 'shooting-game', title: 'WASD射击', icon: '🎯', url: 'shooting-game.html', description: 'WASD移动，鼠标瞄准射击！消灭不断涌来的敌人，挑战你的极限分数。' },
    { cardId: 'campus-survival', title: '校园求生', icon: '🏫', url: 'campus-survival.html', description: '3D冒险游戏！选择角色，在风雨雪雹中从校门口穿越到学校教室，收集道具保护自己。' }
];

// KV 中 mod- 前缀的内置游戏"AI 改编版",在启动时确保归属挂到 yjh@sivani.net。
const BUILTIN_MOD_GAMES = [
    { modId: 'mod-rainbow-tetris', title: '七彩俄罗斯方块（编程版）', icon: '🌈', description: '在原版七彩俄罗斯方块基础上做的编程改进版本。' },
    { modId: 'mod-snake-game', title: '快乐贪吃蛇（编程版）', icon: '🐍', description: '在原版快乐贪吃蛇基础上做的编程改进版本。' }
];

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const db = env.DB || env.YJH_DB || env.D1_DATABASE;
        if (!db) return json({ success: false, error: '缺少 Cloudflare D1 绑定。请把 D1 数据库绑定名设置为 DB。' }, 500);

        await initDb(db);
        // 若 KV 可用,顺便把 mod- 记录归属迁移到 yjh@sivani.net(幂等,已挂好则跳过)
        try { await migrateBuiltinOverridesToFeaturedOwner(db, env.GAMES_KV || null); } catch { /* 迁移失败不影响主流程 */ }
        const body = await request.json();
        const action = String(body.action || '').trim();

        if (action === 'publicSettings') return getPublicSettings(db);
        if (action === 'login') return login(db, body);
        if (action === 'register') return register(db, body, request);

        const session = await getSession(db, request, body);
        if (action === 'leaderboard') return getLeaderboard(db, session?.user || null, env.GAMES_KV);
        if (!session) return json({ success: false, error: '请先登录。' }, 401);

        if (action === 'me') return json({ success: true, user: publicUser(session.user), settings: filterSensitiveSettings(await getSettings(db)) });
        if (action === 'listMembers') return requireSystemAdmin(session, () => listMembers(db));
        if (action === 'saveMember') return requireSystemAdmin(session, () => saveMember(db, body));
        if (action === 'listInviteCodes') return requireAnyAdmin(session, () => listInviteCodes(db));
        if (action === 'saveInviteCode') return requireAnyAdmin(session, () => saveInviteCode(db, session.user, body));
        if (action === 'deleteInviteCode') return requireAnyAdmin(session, () => deleteInviteCode(db, body));
        if (action === 'getSettings') return requireSystemAdmin(session, () => getAdminSettings(db));
        if (action === 'saveSettings') return requireSystemAdmin(session, () => saveSettings(db, body));
        if (action === 'testAiProvider') return requireSystemAdmin(session, () => testAiProvider(db, env));
        if (action === 'listRechargeAccounts') return requireSystemAdmin(session, () => listRechargeAccounts(db));
        if (action === 'saveRechargeAccount') return requireSystemAdmin(session, () => saveRechargeAccount(db, body));
        if (action === 'deleteRechargeAccount') return requireSystemAdmin(session, () => deleteRechargeAccount(db, body));
        if (action === 'adjustPoints') return requireSystemAdmin(session, () => adjustPoints(db, body, session.user));
        if (action === 'setUserRole') return requireSystemAdmin(session, () => setUserRole(db, body));
        if (action === 'deleteMember') return requireSystemAdmin(session, () => deleteMember(db, body));
        if (action === 'pointLogs') return getPointLogs(db, session.user);
        if (action === 'myProfile') return requireMember(session, () => getMyProfile(db, session.user));
        if (action === 'saveCard') return requireMember(session, () => saveCard(db, session.user, body));
        if (action === 'recommend') return requireMember(session, () => setRecommendState(db, session.user, body, env.GAMES_KV));
        if (action === 'adminRecommend') return requireAnyAdmin(session, () => adminSetRecommend(db, body, env.GAMES_KV));
        if (action === 'rateGame') return requireMember(session, () => rateGame(db, session.user, body, env.GAMES_KV));
        if (action === 'playLeaderboardGame') return requireMember(session, () => playLeaderboardGame(db, session.user, body, env.GAMES_KV));

        return json({ success: false, error: '未知操作。' }, 400);
    } catch (error) {
        return json({ success: false, error: error.message || '会员接口失败' }, 500);
    }
}

async function initDb(db) {
    return _initDb(db);
}

export async function ensureAuthDbReady(db) {
    return _initDb(db);
}

async function _initDb(db) {
    const statements = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            display_name TEXT NOT NULL DEFAULT '',
            points INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT DEFAULT ''
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS invite_codes (
            code TEXT PRIMARY KEY,
            created_by INTEGER,
            expires_at TEXT DEFAULT '',
            max_uses INTEGER NOT NULL DEFAULT 1,
            used_count INTEGER NOT NULL DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS invite_uses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            ip TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS member_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_id TEXT NOT NULL,
            title TEXT DEFAULT '',
            icon TEXT DEFAULT '🎮',
            description TEXT DEFAULT '',
            url TEXT DEFAULT '',
            recommended INTEGER NOT NULL DEFAULT 0,
            recommended_at TEXT DEFAULT '',
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, card_id)
        )`,
        `CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_user_id INTEGER NOT NULL,
            card_id TEXT NOT NULL,
            rater_user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(owner_user_id, card_id, rater_user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS recharge_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            account TEXT NOT NULL,
            qr_url TEXT DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS point_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            delta INTEGER NOT NULL,
            reason TEXT NOT NULL,
            ref_type TEXT DEFAULT '',
            ref_id TEXT DEFAULT '',
            meta TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS game_plays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            owner_user_id INTEGER NOT NULL,
            card_id TEXT NOT NULL,
            cost INTEGER NOT NULL DEFAULT 0,
            reward INTEGER NOT NULL DEFAULT 0,
            play_key TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS register_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            invite_code TEXT DEFAULT '',
            success INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )`
    ];
    for (const sql of statements) await db.prepare(sql).run();
    await migrateDb(db);
    await seedUser(db, GAME_ADMIN_USERNAME, GAME_ADMIN_PASSWORD, 'game_admin', '游戏管理员', 0);
    await seedUser(db, SYSTEM_ADMIN_USERNAME, SYSTEM_ADMIN_PASSWORD, 'system_admin', '系统管理员', 0);
    await seedFeaturedLeaderboardGames(db);
    await seedSettings(db);
}

// 把 KV 里已有的 mod-{builtinId} 覆盖版归属统一挂到 yjh@sivani.net,
// 并把对应的推荐卡片写入 member_cards(推荐上限专供该账号,不占普通会员的 3 张位)。
export async function migrateBuiltinOverridesToFeaturedOwner(db, kv) {
    if (!kv) return;
    await ensureFeaturedOwner(db);
    const owner = await db.prepare('SELECT id, username, display_name FROM users WHERE username = ?').bind(FEATURED_OWNER_USERNAME).first();
    if (!owner) return;
    const now = new Date().toISOString();
    for (const featured of BUILTIN_MOD_GAMES) {
        const key = `game:${featured.modId}`;
        let stored;
        try { stored = await kv.get(key, { type: 'json' }); } catch { stored = null; }
        if (!stored) continue;
        // 补齐 owner / ownerName,若已经是目标账号则跳过写 KV
        const needFix = stored.owner !== FEATURED_OWNER_USERNAME || stored.ownerName !== FEATURED_OWNER_DISPLAY;
        if (needFix) {
            const nextGame = {
                ...stored,
                owner: FEATURED_OWNER_USERNAME,
                ownerName: FEATURED_OWNER_DISPLAY,
                trashed: Boolean(stored.trashed),
                trashedAt: stored.trashedAt || '',
                updatedAt: now
            };
            try {
                await kv.put(key, JSON.stringify(nextGame), {
                    metadata: {
                        title: nextGame.title || featured.title,
                        icon: nextGame.icon || featured.icon,
                        description: nextGame.description || featured.description,
                        owner: FEATURED_OWNER_USERNAME,
                        ownerName: FEATURED_OWNER_DISPLAY,
                        updatedAt: now,
                        trashed: Boolean(nextGame.trashed),
                        trashedAt: nextGame.trashedAt || ''
                    }
                });
            } catch { /* KV 写入失败时忽略,下次启动再重试 */ }
        }
        const title = stored.title || featured.title;
        const icon = stored.icon || featured.icon;
        const description = stored.description || featured.description;
        const url = `/api/games?id=${featured.modId}&view=1`;
        await db.prepare(`INSERT INTO member_cards (user_id, card_id, title, icon, description, url, recommended, recommended_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            ON CONFLICT(user_id, card_id) DO UPDATE SET
                title = excluded.title,
                icon = excluded.icon,
                description = excluded.description,
                url = excluded.url,
                recommended = CASE WHEN member_cards.recommended = 1 THEN 1 ELSE 1 END,
                recommended_at = CASE WHEN member_cards.recommended_at = '' OR member_cards.recommended_at IS NULL THEN excluded.recommended_at ELSE member_cards.recommended_at END,
                updated_at = excluded.updated_at`)
            .bind(owner.id, featured.modId, title, icon, description, url, now, now).run();
    }
}

async function migrateDb(db) {
    const migrations = [
        'ALTER TABLE game_plays ADD COLUMN play_key TEXT DEFAULT \'\''
    ];
    for (const sql of migrations) {
        try { await db.prepare(sql).run(); } catch (error) { /* 字段已存在时忽略 */ }
    }
}

async function seedUser(db, username, password, role, displayName, points) {
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT id, role, password, display_name FROM users WHERE username = ?').bind(username).first();
    if (existing) {
        await db.prepare('UPDATE users SET role = ?, password = ?, display_name = ?, updated_at = ? WHERE id = ?')
            .bind(role, password, existing.display_name || displayName, now, existing.id).run();
        return;
    }
    await db.prepare('INSERT INTO users (username, password, role, display_name, points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(username, password, role, displayName, points, now, now).run();
}

async function seedFeaturedLeaderboardGames(db) {
    const now = new Date().toISOString();
    await ensureFeaturedOwner(db);
    const owner = await db.prepare('SELECT id FROM users WHERE username = ?').bind(FEATURED_OWNER_USERNAME).first();
    if (!owner) return;
    for (const game of FEATURED_GAMES) {
        await db.prepare(`INSERT INTO member_cards (user_id, card_id, title, icon, description, url, recommended, recommended_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, '', ?)
            ON CONFLICT(user_id, card_id) DO UPDATE SET title = excluded.title, icon = excluded.icon, description = excluded.description, url = excluded.url, recommended = 0, recommended_at = '', updated_at = excluded.updated_at`)
            .bind(owner.id, game.cardId, game.title, game.icon, game.description, game.url, now).run();
    }
}

async function ensureFeaturedOwner(db) {
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(FEATURED_OWNER_USERNAME).first();
    if (existing) {
        await db.prepare('UPDATE users SET role = ?, display_name = CASE WHEN display_name = \'\' THEN ? ELSE display_name END, updated_at = ? WHERE id = ?')
            .bind('member', FEATURED_OWNER_DISPLAY, now, existing.id).run();
        return;
    }
    await db.prepare('INSERT INTO users (username, password, role, display_name, points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(FEATURED_OWNER_USERNAME, FEATURED_OWNER_PASSWORD, 'member', FEATURED_OWNER_DISPLAY, 200, now, now).run();
}

async function seedSettings(db) {
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        await db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').bind(key, value, now).run();
    }
}

async function login(db, body) {
    const username = sanitizeUsername(body.username || '');
    const password = String(body.password || '').trim();
    if (!username || !password) return json({ success: false, error: '请输入账号和密码。' }, 400);
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user || String(user.password || '') !== password) return json({ success: false, error: '账号或密码错误。' }, 403);
    const token = createToken();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(token, user.id, now.toISOString(), expires).run();
    await db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(now.toISOString(), now.toISOString(), user.id).run();
    return json({ success: true, token, user: publicUser(user), settings: await getSettings(db) });
}

async function register(db, body, request) {
    const rawUsername = String(body.username || '').trim();
    const username = sanitizeUsername(rawUsername);
    const password = String(body.password || '').trim();
    const displayName = sanitizeText(body.displayName || username, 32) || username;
    const code = sanitizeInviteCode(body.inviteCode || '');
    const ip = getClientIp(request);
    const settings = await getSettings(db);
    const limit = numberSetting(settings, 'register_ip_limit_per_hour', 3);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const attempts = await db.prepare('SELECT COUNT(*) AS count FROM register_attempts WHERE ip = ? AND created_at >= ?').bind(ip, since).first();
    if (Number(attempts?.count || 0) >= limit) return json({ success: false, error: '当前网络注册太频繁，请稍后再试。' }, 429);

    const failLog = async () => db.prepare('INSERT INTO register_attempts (ip, invite_code, success, created_at) VALUES (?, ?, 0, ?)').bind(ip, code, new Date().toISOString()).run();
    if (!username || !password) { await failLog(); return json({ success: false, error: '注册账号和密码不能为空。' }, 400); }
    if (username !== rawUsername.toLowerCase()) { await failLog(); return json({ success: false, error: '账号只能使用字母、数字、下划线、短横线、点号或邮箱格式。' }, 400); }
    if (password.length < 4) { await failLog(); return json({ success: false, error: '密码至少 4 位。' }, 400); }
    const inviteRequired = String(settings.invite_required ?? '1') !== '0';
    if (inviteRequired && !code) { await failLog(); return json({ success: false, error: '请输入邀请码。' }, 400); }
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) { await failLog(); return json({ success: false, error: '账号已存在，请换一个。' }, 400); }
    let invite = null;
    if (inviteRequired) {
        invite = await db.prepare('SELECT * FROM invite_codes WHERE code = ?').bind(code).first();
        if (!isInviteUsable(invite)) { await failLog(); return json({ success: false, error: '邀请码无效、已过期或使用次数已满。' }, 400); }
    }

    const now = new Date().toISOString();
    const bonus = numberSetting(settings, 'signup_bonus_points', 200);
    const insert = await db.prepare('INSERT INTO users (username, password, role, display_name, points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(username, password, 'member', displayName, bonus, now, now).run();
    const userId = insert.meta.last_row_id;
    if (inviteRequired) {
        await db.prepare('UPDATE invite_codes SET used_count = used_count + 1, updated_at = ? WHERE code = ?').bind(now, code).run();
        await db.prepare('INSERT INTO invite_uses (code, user_id, ip, created_at) VALUES (?, ?, ?, ?)').bind(code, userId, ip, now).run();
    }
    await db.prepare('INSERT INTO register_attempts (ip, invite_code, success, created_at) VALUES (?, ?, 1, ?)').bind(ip, code, now).run();
    await addPointLog(db, userId, bonus, '注册赠送积分', 'register', inviteRequired ? code : 'open_register', {});
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    const loginResult = await login(db, { username, password });
    const data = await loginResult.json();
    return json({ ...data, user: publicUser(user), message: `注册成功，已赠送 ${bonus} 积分。` });
}

async function getSession(db, request, body = {}) {
    const auth = request.headers.get('Authorization') || '';
    const token = String(body.token || auth.replace(/^Bearer\s+/i, '') || '').trim();
    if (!token) return null;
    const row = await db.prepare('SELECT s.token, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(token).first();
    if (!row || String(row.expires_at || '') < new Date().toISOString()) return null;
    return { token, user: row };
}

function requireAnyAdmin(session, fn) {
    if (!['game_admin', 'system_admin'].includes(session.user.role)) return json({ success: false, error: '只有管理员可以操作。' }, 403);
    return fn();
}

function requireSystemAdmin(session, fn) {
    if (session.user.role !== 'system_admin') return json({ success: false, error: '只有系统管理员可以操作。' }, 403);
    return fn();
}

function requireMember(session, fn) {
    if (session.user.role !== 'member') return json({ success: false, error: '只有注册会员可以操作。' }, 403);
    return fn();
}

async function listMembers(db) {
    return json({ success: true, members: (await listMembersData(db)).map(publicUser) });
}

async function saveMember(db, body) {
    const username = sanitizeUsername(body.username || '');
    const password = String(body.password || '').trim();
    const displayName = sanitizeText(body.displayName || username, 32) || username;
    const points = Math.max(0, Number(body.points || 0));
    const role = sanitizeRole(body.role || 'member');
    if (!username) return json({ success: false, error: '账号不能为空。' }, 400);
    if ([GAME_ADMIN_USERNAME, SYSTEM_ADMIN_USERNAME].includes(username)) return json({ success: false, error: '内置管理员不能在这里修改。' }, 400);
    const existing = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!existing && !password) return json({ success: false, error: '新增用户必须填写密码。' }, 400);
    const now = new Date().toISOString();
    if (existing) {
        if (password) {
            await db.prepare('UPDATE users SET password = ?, role = ?, display_name = ?, points = ?, updated_at = ? WHERE username = ?')
                .bind(password, role, displayName, points, now, username).run();
        } else {
            await db.prepare('UPDATE users SET role = ?, display_name = ?, points = ?, updated_at = ? WHERE username = ?')
                .bind(role, displayName, points, now, username).run();
        }
    } else {
        await db.prepare('INSERT INTO users (username, password, role, display_name, points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(username, password, role, displayName, points, now, now).run();
    }
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    return json({ success: true, member: publicUser(user), members: (await listMembersData(db)).map(publicUser) });
}

async function listMembersData(db) {
    const result = await db.prepare(`SELECT id, username, role, display_name, points, created_at, updated_at, last_login_at FROM users ORDER BY role, created_at DESC`).all();
    return result.results || [];
}

async function listInviteCodes(db) {
    const result = await db.prepare(`SELECT i.*, u.display_name AS creator_name FROM invite_codes i LEFT JOIN users u ON u.id = i.created_by ORDER BY i.created_at DESC`).all();
    return json({ success: true, inviteCodes: result.results || [] });
}

async function saveInviteCode(db, user, body) {
    const code = sanitizeInviteCode(body.code || createInviteCode());
    const maxUses = Math.max(1, Math.min(9999, Number(body.maxUses || 1)));
    const expiresAt = sanitizeDate(body.expiresAt || '');
    const active = body.active === false ? 0 : 1;
    if (!code) return json({ success: false, error: '邀请码不能为空。' }, 400);
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO invite_codes (code, created_by, expires_at, max_uses, used_count, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET expires_at = excluded.expires_at, max_uses = MAX(excluded.max_uses, invite_codes.used_count), active = excluded.active, updated_at = excluded.updated_at`)
        .bind(code, user.id, expiresAt, maxUses, active, now, now).run();
    return listInviteCodes(db);
}

async function deleteInviteCode(db, body) {
    const code = sanitizeInviteCode(body.code || '');
    if (!code) return json({ success: false, error: '缺少邀请码。' }, 400);
    await db.prepare('DELETE FROM invite_codes WHERE code = ?').bind(code).run();
    return listInviteCodes(db);
}

async function getSettings(db) {
    const result = await db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries((result.results || []).map(row => [row.key, row.value]));
}

async function getPublicSettings(db) {
    const settings = await getSettings(db);
    const recharge = await db.prepare('SELECT name, account, qr_url FROM recharge_accounts WHERE active = 1 ORDER BY id DESC').all();
    return json({
        success: true,
        settings: {
            signup_bonus_points: settings.signup_bonus_points,
            ai_create_cost: settings.ai_create_cost,
            ai_edit_cost: settings.ai_edit_cost,
            leaderboard_play_cost: settings.leaderboard_play_cost,
            leaderboard_owner_reward: settings.leaderboard_owner_reward,
            recharge_min_yuan: settings.recharge_min_yuan,
            recharge_points_per_10_yuan: settings.recharge_points_per_10_yuan,
            register_ip_limit_per_hour: settings.register_ip_limit_per_hour,
            invite_required: settings.invite_required ?? '1',
            wechat_account_name: settings.wechat_account_name || '',
            wechat_qr_image: settings.wechat_qr_image,
            recharge_notice: settings.recharge_notice
        },
        rechargeAccounts: recharge.results || []
    });
}

async function getAdminSettings(db) {
    const settings = await getSettings(db);
    // 对 api key 做脱敏，前端只显示掩码。保存时如果收到掩码则不更新该字段。
    const apiKey = String(settings.ai_api_key || '');
    if (apiKey) {
        settings.ai_api_key_masked = maskApiKey(apiKey);
        settings.ai_api_key = '';
    } else {
        settings.ai_api_key_masked = '';
    }
    return json({ success: true, settings });
}

function maskApiKey(value) {
    const text = String(value || '');
    if (!text) return '';
    if (text.length <= 8) return '****';
    return `${text.slice(0, 4)}****${text.slice(-4)}`;
}

function filterSensitiveSettings(settings) {
    const cleaned = {};
    for (const [key, value] of Object.entries(settings || {})) {
        if (SENSITIVE_SETTING_KEYS.has(key)) continue;
        cleaned[key] = value;
    }
    return cleaned;
}

async function testAiProvider(db, env) {
    try {
        const config = await resolveProvider(env, 'chat', db);
        if (!config.apiKey) {
            return json({ success: false, error: '未配置 AI API Key。' }, 400);
        }
        const requestBody = {
            model: config.model,
            messages: [
                { role: 'system', content: '你是一个测试助手，请只回复"OK"。' },
                { role: 'user', content: '连通性测试。' }
            ],
            temperature: 0
        };
        requestBody[config.tokenParamName] = 32;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        let res;
        try {
            res = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }
        const text = await res.text();
        if (!res.ok) {
            return json({ success: false, error: `AI 接口测试失败（HTTP ${res.status}）：${text.slice(0, 400)}`, baseUrl: config.baseUrl, model: config.model }, 502);
        }
        return json({
            success: true,
            message: 'AI 连接成功。',
            baseUrl: config.baseUrl,
            model: config.model,
            preview: text.slice(0, 200)
        });
    } catch (error) {
        return json({ success: false, error: `AI 接口测试异常：${error.message || error}` }, 500);
    }
}

async function saveSettings(db, body) {
    const settings = body.settings || {};
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const now = new Date().toISOString();
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            const rawValue = settings[key];
            // ai_api_key 特殊处理：如果传空字符串，则保留原有值（避免脱敏显示后被清空）
            if (key === 'ai_api_key' && (rawValue === '' || rawValue == null)) continue;
            await db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').bind(key, String(rawValue ?? ''), now).run();
        }
    }
    return getAdminSettings(db);
}

async function listRechargeAccounts(db) {
    const result = await db.prepare('SELECT * FROM recharge_accounts ORDER BY id DESC').all();
    return json({ success: true, accounts: result.results || [] });
}

async function saveRechargeAccount(db, body) {
    const id = Number(body.id || 0);
    const name = sanitizeText(body.name || '充值微信', 32);
    const account = sanitizeText(body.account || '', 80);
    const qrUrl = sanitizeDataOrUrl(body.qrUrl || '');
    const active = body.active === false ? 0 : 1;
    if (!account) return json({ success: false, error: '微信账户不能为空。' }, 400);
    const now = new Date().toISOString();
    if (id) {
        await db.prepare('UPDATE recharge_accounts SET name = ?, account = ?, qr_url = ?, active = ?, updated_at = ? WHERE id = ?').bind(name, account, qrUrl, active, now, id).run();
    } else {
        await db.prepare('INSERT INTO recharge_accounts (name, account, qr_url, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(name, account, qrUrl, active, now, now).run();
    }
    return listRechargeAccounts(db);
}

async function deleteRechargeAccount(db, body) {
    const id = Number(body.id || 0);
    if (!id) return json({ success: false, error: '缺少充值账户 ID。' }, 400);
    await db.prepare('DELETE FROM recharge_accounts WHERE id = ?').bind(id).run();
    return listRechargeAccounts(db);
}

async function adjustPoints(db, body, admin) {
    const username = sanitizeUsername(body.username || '');
    const delta = Number(body.delta || 0);
    const reason = sanitizeText(body.reason || '系统管理员调整积分', 80);
    if (!username || !Number.isFinite(delta) || delta === 0) return json({ success: false, error: '请输入会员账号和非 0 积分变化。' }, 400);
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) return json({ success: false, error: '用户不存在。' }, 404);
    if ([GAME_ADMIN_USERNAME, SYSTEM_ADMIN_USERNAME].includes(user.username)) return json({ success: false, error: '内置管理员积分不能在这里调整。' }, 400);
    if (Number(user.points || 0) + delta < 0) return json({ success: false, error: '扣减后积分不能小于 0。' }, 400);
    await changePoints(db, user.id, delta, reason, 'admin_adjust', String(admin.id), { admin: admin.username });
    return listMembers(db);
}

async function setUserRole(db, body) {
    const username = sanitizeUsername(body.username || '');
    const role = sanitizeRole(body.role || 'member');
    if (!username) return json({ success: false, error: '缺少用户账号。' }, 400);
    if ([GAME_ADMIN_USERNAME, SYSTEM_ADMIN_USERNAME].includes(username)) return json({ success: false, error: '内置管理员角色不能切换。' }, 400);
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE username = ?').bind(role, now, username).run();
    return listMembers(db);
}

async function deleteMember(db, body) {
    const username = sanitizeUsername(body.username || '');
    if (!username) return json({ success: false, error: '缺少用户账号。' }, 400);
    if ([GAME_ADMIN_USERNAME, SYSTEM_ADMIN_USERNAME].includes(username)) return json({ success: false, error: '内置管理员不能删除。' }, 400);
    const user = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!user) return json({ success: false, error: '用户不存在。' }, 404);
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
    await db.prepare('DELETE FROM member_cards WHERE user_id = ?').bind(user.id).run();
    await db.prepare('DELETE FROM ratings WHERE rater_user_id = ? OR owner_user_id = ?').bind(user.id, user.id).run();
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
    return listMembers(db);
}

async function getPointLogs(db, user) {
    const targetId = ['game_admin', 'system_admin'].includes(user.role) && user.id !== undefined ? Number(user.id) : user.id;
    const result = await db.prepare('SELECT * FROM point_logs WHERE user_id = ? ORDER BY id DESC LIMIT 50').bind(targetId).all();
    return json({ success: true, logs: result.results || [] });
}

async function getMyProfile(db, user) {
    const cards = await getCards(db, user.id);
    const fresh = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    return json({ success: true, profile: { ...publicUser(fresh), cards } });
}

async function saveCard(db, user, body) {
    const card = body.card || {};
    const cardId = sanitizeCardId(card.id || '');
    if (!cardId) return json({ success: false, error: '游戏不存在。' }, 400);
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT * FROM member_cards WHERE user_id = ? AND card_id = ?').bind(user.id, cardId).first();
    if (!existing) return json({ success: false, error: '请先创建这个编程游戏后再修改名称和简介。' }, 400);
    await db.prepare('UPDATE member_cards SET title = ?, description = ?, updated_at = ? WHERE user_id = ? AND card_id = ?')
        .bind(sanitizeText(card.title || '', 40), sanitizeText(card.description || '', 160), now, user.id, cardId).run();
    return getMyProfile(db, user);
}

async function setRecommendState(db, user, body, kv = null) {
    const cardId = sanitizeCardId(body.cardId || '');
    const recommended = body.recommended === true;
    if (!cardId) return json({ success: false, error: '游戏不存在。' }, 400);
    const card = await db.prepare('SELECT * FROM member_cards WHERE user_id = ? AND card_id = ?').bind(user.id, cardId).first();
    if (!card) return json({ success: false, error: '请先保存这个编程游戏后再推荐。' }, 400);
    if (recommended && (!card?.title || !card?.url)) return json({ success: false, error: '推荐前请先确认游戏标题和游戏地址。' }, 400);
    if (recommended && await isCardTrashed(kv, cardId)) return json({ success: false, error: '回收站中的游戏不能推荐到榜单。' }, 400);
    if (recommended && !card.recommended) {
        const count = await db.prepare('SELECT COUNT(*) AS total FROM member_cards WHERE user_id = ? AND recommended = 1').bind(user.id).first();
        if (Number(count?.total || 0) >= MAX_MEMBER_CARDS) return json({ success: false, error: `最多只能推荐 ${MAX_MEMBER_CARDS} 个游戏到榜单游戏。` }, 400);
    }
    const now = new Date().toISOString();
    await db.prepare('UPDATE member_cards SET recommended = ?, recommended_at = ?, updated_at = ? WHERE user_id = ? AND card_id = ?')
        .bind(recommended ? 1 : 0, recommended ? (card.recommended_at || now) : '', now, user.id, cardId).run();
    const profile = await getProfileObject(db, user.id);
    return json({ success: true, profile, leaderboard: await buildLeaderboard(db, user, kv) });
}

async function getLeaderboard(db, user, kv = null) {
    return json({ success: true, leaderboard: await buildLeaderboard(db, user, kv) });
}

// 管理员对任意用户的卡片进行推荐/下架切换,不受 3 张上限约束
async function adminSetRecommend(db, body, kv = null) {
    const owner = sanitizeUsername(body.owner || '');
    const cardId = sanitizeCardId(body.cardId || '');
    const recommended = body.recommended === true;
    if (!owner || !cardId) return json({ success: false, error: '缺少 owner 或 cardId。' }, 400);
    const ownerUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(owner).first();
    if (!ownerUser) return json({ success: false, error: '推荐人不存在。' }, 404);
    const card = await db.prepare('SELECT * FROM member_cards WHERE user_id = ? AND card_id = ?').bind(ownerUser.id, cardId).first();
    if (!card) return json({ success: false, error: '推荐目录里没有这张卡片。' }, 404);
    if (recommended && await isCardTrashed(kv, cardId)) return json({ success: false, error: '回收站中的游戏不能推荐到榜单。' }, 400);
    const now = new Date().toISOString();
    await db.prepare('UPDATE member_cards SET recommended = ?, recommended_at = ?, updated_at = ? WHERE user_id = ? AND card_id = ?')
        .bind(recommended ? 1 : 0, recommended ? (card.recommended_at || now) : '', now, ownerUser.id, cardId).run();
    return json({ success: true, leaderboard: await buildLeaderboard(db, null, kv) });
}

async function rateGame(db, user, body, kv = null) {
    const owner = sanitizeUsername(body.owner || '');
    const cardId = sanitizeCardId(body.cardId || '');
    const score = Math.max(1, Math.min(5, Number(body.score || 0)));
    const ownerUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind(owner).first();
    if (!ownerUser || !cardId || !Number.isFinite(score)) return json({ success: false, error: '评分参数不完整。' }, 400);
    if (ownerUser.id === user.id) return json({ success: false, error: '不能给自己的榜单游戏打分。' }, 400);
    if (await isCardTrashed(kv, cardId)) return json({ success: false, error: '榜单游戏已在回收站。' }, 404);
    const card = await db.prepare('SELECT * FROM member_cards WHERE user_id = ? AND card_id = ? AND recommended = 1').bind(ownerUser.id, cardId).first();
    if (!card) return json({ success: false, error: '榜单游戏不存在或尚未推荐。' }, 404);
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO ratings (owner_user_id, card_id, rater_user_id, score, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(owner_user_id, card_id, rater_user_id) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`)
        .bind(ownerUser.id, cardId, user.id, score, now).run();
    return json({ success: true, leaderboard: await buildLeaderboard(db, user, kv) });
}

async function playLeaderboardGame(db, user, body, kv = null) {
    const owner = sanitizeUsername(body.owner || '');
    const cardId = sanitizeCardId(body.cardId || '');
    const idempotencyKey = sanitizePlayKey(body.playKey || '');
    const ownerUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind(owner).first();
    if (await isCardTrashed(kv, cardId)) return json({ success: false, error: '榜单游戏已在回收站。' }, 404);
    const card = ownerUser ? await db.prepare('SELECT * FROM member_cards WHERE user_id = ? AND card_id = ? AND recommended = 1').bind(ownerUser.id, cardId).first() : null;
    if (!ownerUser || !card) return json({ success: false, error: '榜单游戏不存在。' }, 404);
    if (idempotencyKey) {
        const charged = await db.prepare('SELECT id FROM game_plays WHERE player_id = ? AND play_key = ?').bind(user.id, idempotencyKey).first();
        if (charged) return json({ success: true, url: card.url, user: publicUser(user), leaderboard: await buildLeaderboard(db, user, kv), charged: false });
    }
    const settings = await getSettings(db);
    const cost = numberSetting(settings, 'leaderboard_play_cost', 2);
    const reward = numberSetting(settings, 'leaderboard_owner_reward', 1);
    if (ownerUser.id !== user.id) {
        const player = await db.prepare('SELECT points FROM users WHERE id = ?').bind(user.id).first();
        if (Number(player?.points || 0) < cost) return json({ success: false, error: `积分不足，玩他人的榜单游戏需要 ${cost} 积分。` }, 400);
        await changePoints(db, user.id, -cost, '玩他人的榜单游戏', 'leaderboard_play', `${owner}:${cardId}`, { owner, cardId });
        await changePoints(db, ownerUser.id, reward, '推荐游戏被他人游玩奖励', 'leaderboard_play_reward', `${user.username}:${cardId}`, { player: user.username, cardId });
    }
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO game_plays (player_id, owner_user_id, card_id, cost, reward, play_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(user.id, ownerUser.id, cardId, ownerUser.id === user.id ? 0 : cost, ownerUser.id === user.id ? 0 : reward, idempotencyKey, now).run();
    const fresh = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    return json({ success: true, url: card.url, user: publicUser(fresh), leaderboard: await buildLeaderboard(db, fresh, kv) });
}

async function buildLeaderboard(db, currentUser = null, kv = null) {
    const result = await db.prepare(`
        SELECT c.*, u.username AS owner, u.display_name AS owner_name,
            COALESCE(AVG(r.score), 0) AS average_score,
            COUNT(r.id) AS rating_count,
            MAX(CASE WHEN r.rater_user_id = ? THEN r.score ELSE 0 END) AS my_score
        FROM member_cards c
        JOIN users u ON u.id = c.user_id
        LEFT JOIN ratings r ON r.owner_user_id = c.user_id AND r.card_id = c.card_id
        WHERE c.recommended = 1
        GROUP BY c.user_id, c.card_id
        ORDER BY average_score DESC, rating_count DESC, c.recommended_at DESC`).bind(currentUser?.id || 0).all();
    const rows = [];
    for (const row of (result.results || [])) {
        if (await isCardTrashed(kv, row.card_id)) continue;
        rows.push(row);
    }
    return rows.map(row => ({
        id: `${row.owner}__${row.card_id}`,
        owner: row.owner,
        ownerName: row.owner_name || row.owner,
        cardId: row.card_id,
        title: row.title || '未命名游戏',
        icon: row.icon || '🎮',
        description: row.description || '',
        url: row.url || '',
        averageScore: Math.round(Number(row.average_score || 0) * 10) / 10,
        ratingCount: Number(row.rating_count || 0),
        myScore: Number(row.my_score || 0),
        recommendedAt: row.recommended_at || ''
    }));
}

async function ensureCards(db, userId) {
    const now = new Date().toISOString();
    for (let i = 1; i <= MAX_MEMBER_CARDS; i++) {
        await db.prepare('INSERT OR IGNORE INTO member_cards (user_id, card_id, updated_at) VALUES (?, ?, ?)').bind(userId, `card-${i}`, now).run();
    }
}

async function getCards(db, userId) {
    const result = await db.prepare('SELECT * FROM member_cards WHERE user_id = ? ORDER BY updated_at DESC').bind(userId).all();
    return (result.results || [])
        .filter(card => card.title || card.url || card.description)
        .map(card => ({
            id: card.card_id,
            title: card.title || '',
            icon: card.icon || '🎮',
            description: card.description || '',
            url: card.url || '',
            recommended: Boolean(card.recommended),
            recommendedAt: card.recommended_at || '',
            updatedAt: card.updated_at || ''
        }));
}

async function getProfileObject(db, userId) {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    return { ...publicUser(user), cards: await getCards(db, userId) };
}

async function isCardTrashed(kv, cardId) {
    if (!kv || !cardId || !/^(mod-)?[a-z0-9_-]+$/.test(String(cardId))) return false;
    try {
        const stored = await kv.get(`game:${cardId}`, { type: 'json' });
        return Boolean(stored?.trashed);
    } catch (error) {
        return false;
    }
}

async function changePoints(db, userId, delta, reason, refType = '', refId = '', meta = {}) {
    const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first();
    const next = Number(user?.points || 0) + Number(delta || 0);
    if (next < 0) throw new Error('积分不足。');
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET points = ?, updated_at = ? WHERE id = ?').bind(next, now, userId).run();
    await addPointLog(db, userId, delta, reason, refType, refId, meta);
}

async function addPointLog(db, userId, delta, reason, refType, refId, meta) {
    await db.prepare('INSERT INTO point_logs (user_id, delta, reason, ref_type, ref_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(userId, Number(delta || 0), reason, refType || '', refId || '', JSON.stringify(meta || {}), new Date().toISOString()).run();
}

function isInviteUsable(invite) {
    if (!invite || !invite.active) return false;
    if (invite.expires_at && String(invite.expires_at) < new Date().toISOString()) return false;
    return Number(invite.used_count || 0) < Number(invite.max_uses || 1);
}

function publicUser(user) {
    return {
        username: user.username,
        role: user.role || 'member',
        displayName: user.display_name || user.displayName || user.username,
        points: Number(user.points || 0),
        createdAt: user.created_at || '',
        updatedAt: user.updated_at || ''
    };
}

function numberSetting(settings, key, fallback) {
    const value = Number(settings[key]);
    return Number.isFinite(value) ? value : fallback;
}

function getClientIp(request) {
    return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

function sanitizeUsername(value) {
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9_@.\-]/g, '').slice(0, 80);
}

function sanitizeRole(value) {
    return ['member', 'game_admin'].includes(String(value || '')) ? String(value) : 'member';
}

function sanitizeInviteCode(value) {
    return String(value || '').toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

function sanitizePlayKey(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
}

function sanitizeCardId(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

function sanitizeText(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function sanitizeUrl(value) {
    const url = String(value || '').trim().slice(0, 500);
    if (!url) return '';
    if (/^(https?:\/\/|\/|\.\/|[a-z0-9_-]+\.html(?:[?#].*)?|\/api\/games\?id=)/i.test(url)) return url.replace(/[<>"']/g, '');
    return '';
}

function sanitizeDataOrUrl(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^data:image\//i.test(text)) return text.replace(/\s+/g, '').slice(0, 300000);
    return sanitizeUrl(text);
}

function sanitizeDate(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function createInviteCode() {
    return `YJH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createToken() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    });
}
