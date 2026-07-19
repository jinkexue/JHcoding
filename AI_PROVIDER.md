# AI 供应商配置说明

本项目所有 AI 接口的 `baseUrl`、`apiKey`、`model` 等配置都可以在 **管理员后台** 里直接修改，保存后立即生效，**无需重新部署 Cloudflare**。

## 一、推荐方式：在管理员后台设置（新）

1. 用系统管理员账号（`yqcw@qq.com`）登录网站。
2. 打开「系统管理员后台」→「平台设置」页签 → 滚动到底部找到 **「AI 供应商设置」** 卡片。
3. 填入：
   - **Base URL**：例如 `https://ark.cn-beijing.volces.com/api/v3`
   - **API Key**：粘贴你的 key（保存后会脱敏显示，例如 `sk-a****xyz1`）
   - **生成游戏用的模型**：例如火山方舟的接入点 ID `ep-xxxxxxxxxx` 或模型 ID `doubao-seed-1-6`
   - **AI 助手对话模型**：可留空，默认与上面一致
   - **Token 参数名**：一般选默认（`max_tokens`）；GPT-5 系列等新模型需选 `max_completion_tokens`
   - **最大 Token 数**：可留空使用默认（生成 6000，对话 1200）
4. 点击 **保存 AI 供应商设置**，然后点 **测试 AI 连接** 验证。

**切换供应商** = 修改上面几个字段 + 保存。无需 Cloudflare 环境变量，无需重新部署。

### 火山方舟示例

| 字段 | 值 |
| --- | --- |
| Base URL | `https://ark.cn-beijing.volces.com/api/v3` |
| API Key | 你的火山方舟 API Key |
| 生成游戏用的模型 | `ep-xxxxxxxxxxxxx-xxxxx`（方舟控制台创建的接入点 ID） |

### DeepSeek 示例

| 字段 | 值 |
| --- | --- |
| Base URL | `https://api.deepseek.com/v1` |
| API Key | `sk-xxxxxxxxxxxxxxxx` |
| 生成游戏用的模型 | `deepseek-chat` |

### Kimi（月之暗面）示例

| 字段 | 值 |
| --- | --- |
| Base URL | `https://api.moonshot.cn/v1` |
| API Key | `sk-xxxxxxxxxxxxxxxx` |
| 生成游戏用的模型 | `moonshot-v1-8k` |

### OpenAI 官方示例

| 字段 | 值 |
| --- | --- |
| Base URL | `https://api.openai.com/v1` |
| API Key | `sk-xxxxxxxxxxxxxxxx` |
| 生成游戏用的模型 | `gpt-4o-mini` |

## 二、兼容方式：Cloudflare Pages 环境变量（旧）

如果后台没有配置 AI Key，代码会自动回退到 Cloudflare Pages 环境变量：

- `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`
- 或者 `AI_PROVIDER=XXX` + `XXX_API_KEY` / `XXX_BASE_URL` / `XXX_MODEL`

在 Cloudflare Dashboard → Pages → yjh → Settings → **Environment Variables** 里配置即可。老部署无需改动。

## 三、配置优先级

从高到低：

1. 数据库 `settings` 表里的 `ai_api_key` / `ai_base_url` / `ai_model` 等（后台设置）
2. Cloudflare 环境变量 `{AI_PROVIDER}_XXX`
3. Cloudflare 环境变量 `OPENAI_XXX`
4. 内置默认值（`https://api.openai.com/v1` + `gpt-4o-mini`）

## 四、安全

- API Key 存储在 D1 数据库的 `settings` 表中，只有系统管理员能通过后台读取脱敏后的掩码（例如 `sk-a****xyz1`）。
- 普通用户 / 会员 / 游戏管理员通过 `me` 或 `publicSettings` 接口都拿不到 AI 配置，接口层做了字段过滤。
- 前端输入 API Key 时留空表示"不修改"，避免脱敏显示后误覆盖。

## 五、代码入口

- 后台 UI：`index.html` 中 `#adminTabSettings` 的 "AI 供应商设置" 卡片
- 前端逻辑：`renderAiProviderSettings` / `saveAiProviderSettings` / `testAiProviderSettings`
- 后端读取：`functions/api/_provider.js` 的 `resolveProvider(env, type, db)`
- 后端保存 / 测试：`functions/api/auth.js` 的 `saveSettings` / `testAiProvider`
- 调用点：`functions/api/generate.js` 和 `functions/api/chat.js`
