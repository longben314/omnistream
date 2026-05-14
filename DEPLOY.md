# OmniStream - 部署指南

## 架构概览

- **前端**: React + Vite + TailwindCSS (PWA 支持)
- **后端**: Express.js (Vercel Serverless)
- **数据库**: Turso (云 SQLite，免费层)
- **部署**: Vercel (免费层)
- **定时任务**: Vercel Cron

## 部署步骤

### 1. 注册 Turso 数据库（免费）

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录
turso auth login

# 创建数据库
turso db create omnistream

# 获取连接 URL
turso db show omnistream --url

# 创建认证 Token
turso db tokens create omnistream
```

记下输出的 `URL` 和 `Token`，后面需要用到。

### 2. 注册 Vercel（免费）

1. 访问 [vercel.com](https://vercel.com) 注册账号
2. 安装 Vercel CLI: `npm i -g vercel`

### 3. 上传代码到 GitHub

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建仓库后
git remote add origin https://github.com/你的用户名/omnistream.git
git push -u origin main
```

### 4. 部署到 Vercel

#### 方式一：通过 GitHub 连接（推荐）

1. 登录 Vercel Dashboard
2. 点击 "Add New Project"
3. 选择 GitHub 仓库
4. 配置环境变量（见下方）
5. 点击 Deploy

#### 方式二：通过 CLI 部署

```bash
# 登录 Vercel
vercel login

# 部署
vercel --prod
```

### 5. 配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://omnistream-xxx.turso.co` | Turso 数据库 URL |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOi...` | Turso 认证 Token |
| `JAMENDO_CLIENT_ID` | `b9e8f6d3` | Jamendo API 客户端 ID（可选） |
| `TMDB_API_KEY` | `2dca580c2a14b55200e784d157207b4d` | TMDB API Key（可选） |
| `CRON_SECRET` | `自定义密钥` | Cron 任务认证密钥（可选，用于保护定时任务） |

### 6. 验证部署

部署完成后访问你的 Vercel 域名，检查：
- 首页是否正常加载
- `/api/health` 是否返回 `{"success":true,"message":"ok"}`
- 源管理页面是否可以访问

## 免费额度说明

| 服务 | 免费额度 |
|------|----------|
| Vercel | 100GB 带宽/月，Serverless 函数无限 |
| Turso | 9GB 存储，10亿行读取/月 |
| TMDB API | 1000 请求/天（免费） |
| Jamendo API | 500 请求/小时（免费） |
