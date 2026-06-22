# 围棋对战游戏 - 宝塔面板部署指南

## 一、项目结构

```
D:\code\YJH/
├── go-server.js         # WebSocket 服务器
├── go-game.html         # 前端页面
├── games/               # 棋局保存目录（自动创建）
├── package.json         # 依赖配置
├── package-lock.json
├── node_modules/
├── index.html           # 首页（多游戏入口）
├── campus-survival.html # 其他游戏...
└── ...
```

**围棋游戏文件在根目录**，通过 `https://你的域名/go-game.html` 访问。

---

## 二、环境准备

### 1. 安装宝塔面板
```bash
# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484eea

# Ubuntu/Debian
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484eea
```

### 2. 安装必要软件
在宝塔面板中安装：
- **Node.js 版本管理器** → 选择 Node 18.x 或 20.x
- **PM2 管理器** (进程守护)
- **Nginx** (反向代理 + SSL)

---

## 三、上传项目文件

### 方法1: 宝塔文件管理器
1. 打开宝塔面板 → **文件**
2. 进入 `/www/wwwroot/`
3. 找到你的站点目录（如 `/www/wwwroot/yourdomain.com/`）
4. 创建 `games/` 文件夹（用于保存棋局）
5. 上传以下文件到站点根目录：
   - `go-server.js`
   - `go-game.html`

### 方法2: SSH 上传
```bash
# 进入站点目录
cd /www/wwwroot/你的站点目录

# 创建 games 目录
mkdir -p games

# 上传 go-server.js 和 go-game.html 到站点根目录
# 使用 scp 或宝塔文件管理器上传
```

---

## 四、安装依赖

```bash
cd /www/wwwroot/你的站点目录
npm install
```

> `package.json` 已在项目根目录，`go-server.js` 运行时需要 `ws` 和 `uuid` 模块。

---

## 五、使用 PM2 启动服务

### 1. 宝塔面板操作：
1. 打开 **PM2管理器**
2. 点击 **"+PM2守护"**
3. 填写：
   - **项目名称**: `go-game`
   - **启动文件**: `/www/wwwroot/你的站点目录/go-server.js`
   - **运行目录**: `/www/wwwroot/你的站点目录`
   - **端口**: `3000`
   - **内存限制**: 256M
4. 点击 **确定**

### 2. SSH 命令行：
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start /www/wwwroot/你的站点目录/go-server.js --name "go-game" --max-memory-restart 256M

# 开机自启
pm2 startup
pm2 save
```

---

## 六、配置 Nginx 反向代理

### 宝塔面板操作：

1. **网站** → 找到你的站点 → **设置**

2. **反向代理** → **添加反向代理**：
   - 代理名称: `websocket`
   - 目标URL: `http://127.0.0.1:3000`
   - ** forwarding headers ** 勾选
   - 点击 **保存**

3. **配置文件** 中手动添加 WebSocket 支持（在 server 块内）：
```nginx
location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
```

### 访问地址：
```
https://你的域名/go-game.html
```

---

## 七、防火墙配置

### 1. 宝塔安全面板：
- 放行 `443` (HTTPS，通常已放行)
- 放行 `80` (HTTP，用于SSL申请)
- `3000` 端口**不需要**对外开放

### 2. 云服务器安全组（阿里云/腾讯云等）：
| 端口 | 协议 | 来源 | 说明 |
|------|------|------|------|
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 80 | TCP | 0.0.0.0/0 | HTTP (SSL申请) |

---

## 八、修改访问密码

编辑两处文件中的 `ACCESS_CODE`：

**`go-server.js` 第9行：**
```javascript
const ACCESS_CODE = '150113'; // 改为你的密码
```

**`go-game.html` 中的 ACCESS_CODE：**
```javascript
const ACCESS_CODE = '150113'; // 改为你的密码
```

> ⚠️ 两处密码必须一致！

---

## 九、验证部署

### 1. 访问测试：
```
https://你的域名/go-game.html
```

### 2. 检查服务状态：
```bash
pm2 status
pm2 logs go-game
```

### 3. 常见问题：
| 问题 | 解决方法 |
|------|----------|
| 无法连接服务器 | 检查 PM2 是否运行 (`pm2 status`) |
| WebSocket 失败 | 检查 Nginx 配置中是否有 `Upgrade` 和 `Connection` 头 |
| 404 Not Found | 确认访问路径为 `/go-game.html` |
| 服务崩溃 | 查看日志 `pm2 logs go-game --err` |

---

## 十、高级配置

### 1. 环境变量（可选）
创建 `.env`：
```bash
PORT=3000
ACCESS_CODE=your_password
```

修改 `go-server.js` 开头引入：
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.ACCESS_CODE || '150113';
```

安装 dotenv：
```bash
cd /www/wwwroot/你的站点目录
npm install dotenv
```

### 2. 日志轮转
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. 棋局文件位置
保存的棋局在：`/www/wwwroot/你的站点目录/games/`

---

## 十一、部署流程图

```
用户浏览器 (https://域名/go-game.html)
    ↓ HTTPS
Nginx (宝塔)
    ↓ /ws → 反向代理
Node.js WebSocket Server (:3000)
    ↓
go-server.js
    ↓
房间管理 + 围棋规则 + 棋局保存
```

---

## 十二、常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs go-game

# 重启服务
pm2 restart go-game

# 停止服务
pm2 stop go-game

# 删除服务
pm2 delete go-game

# 查看所有 PM2 进程
pm2 list
```
