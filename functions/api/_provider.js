// 共享模块：解析当前使用的 AI 供应商配置
// Cloudflare Pages Functions 约定：以下划线开头的文件不会作为公开路由暴露。
//
// 配置优先级（从高到低）：
//   1. Cloudflare D1 数据库 settings 表中的 ai_* 字段（管理员在后台设置）
//   2. Cloudflare Pages 环境变量 {AI_PROVIDER}_XXX
//   3. Cloudflare Pages 环境变量 OPENAI_XXX（旧兼容）
//
// 这样管理员可以在网站后台直接切换 baseUrl / apiKey / model，无需重新部署。

const DB_KEYS = {
    apiKey: 'ai_api_key',
    baseUrl: 'ai_base_url',
    model: 'ai_model',
    chatModel: 'ai_chat_model',
    tokenParam: 'ai_token_param',
    maxTokens: 'ai_max_tokens',
    chatMaxTokens: 'ai_chat_max_tokens',
    useResponseFormat: 'ai_use_response_format'
};

export async function resolveProvider(env, type = 'generate', db = null) {
    const dbSettings = await loadDbAiSettings(db);

    const rawProvider = String(env?.AI_PROVIDER || '').trim();
    const provider = rawProvider ? rawProvider.toUpperCase().replace(/[^A-Z0-9_]/g, '_') : '';

    // 环境变量查找顺序：先找 {PROVIDER}_XXX，再回退到 OPENAI_XXX
    const prefixes = [];
    if (provider && provider !== 'OPENAI') prefixes.push(provider);
    prefixes.push('OPENAI');

    const pickEnv = (suffix) => {
        for (const prefix of prefixes) {
            const key = `${prefix}_${suffix}`;
            const value = env?.[key];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                return String(value);
            }
        }
        return '';
    };

    // 数据库优先，环境变量次之
    const pick = (dbKey, envSuffix) => {
        const fromDb = dbSettings[dbKey];
        if (fromDb !== undefined && fromDb !== null && String(fromDb).trim() !== '') {
            return String(fromDb);
        }
        return pickEnv(envSuffix);
    };

    const apiKey = pick(DB_KEYS.apiKey, 'API_KEY');
    const baseUrl = normalizeBaseUrl(pick(DB_KEYS.baseUrl, 'BASE_URL') || 'https://api.openai.com/v1');
    const tokenParamRaw = (pick(DB_KEYS.tokenParam, 'TOKEN_PARAM') || 'max_tokens').trim();
    const useResponseFormatRaw = pick(DB_KEYS.useResponseFormat, 'USE_RESPONSE_FORMAT');
    const useResponseFormat = String(useResponseFormatRaw || '').toLowerCase() === 'true';

    let model;
    let maxTokens;
    if (type === 'chat') {
        model = pick(DB_KEYS.chatModel, 'CHAT_MODEL') || pick(DB_KEYS.model, 'MODEL') || 'gpt-4o-mini';
        maxTokens = Number(pick(DB_KEYS.chatMaxTokens, 'CHAT_MAX_TOKENS') || 1200);
    } else {
        model = pick(DB_KEYS.model, 'MODEL') || 'gpt-4o-mini';
        maxTokens = Number(pick(DB_KEYS.maxTokens, 'MAX_TOKENS') || pickEnv('MAX_COMPLETION_TOKENS') || 6000);
    }

    return {
        provider: provider || 'OPENAI',
        apiKey,
        baseUrl,
        model,
        tokenParamName: tokenParamRaw === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens',
        maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : (type === 'chat' ? 1200 : 6000),
        useResponseFormat,
        source: {
            fromDb: Boolean(dbSettings[DB_KEYS.apiKey] || dbSettings[DB_KEYS.baseUrl] || dbSettings[DB_KEYS.model])
        }
    };
}

async function loadDbAiSettings(db) {
    if (!db) return {};
    try {
        const keys = Object.values(DB_KEYS);
        const placeholders = keys.map(() => '?').join(',');
        const result = await db.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).bind(...keys).all();
        return Object.fromEntries((result.results || []).map(row => [row.key, row.value]));
    } catch (error) {
        return {};
    }
}

function normalizeBaseUrl(url) {
    return String(url || '').replace(/\/+$/, '');
}

export const AI_SETTING_KEYS = DB_KEYS;
