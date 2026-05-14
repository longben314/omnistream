# OmniStream 云端部署完整指南

## 🚀 方案优势

完全免费的云端部署方案：
- **前端/后端**: Vercel（免费层，无限 Serverless 函数，100GB/月带宽）
- **数据库**: Turso（云 SQLite，免费层 9GB 存储，10亿行读取/月）
- **定时任务**: Vercel Cron（内置免费）
- **资源 API**: TMDB + Jamendo（免费 API）

## 📋 部署前准备

### 1. GitHub 账号
- 确保你有 GitHub 账号：[github.com](https://github.com)

### 2. Turso 账号（免费云数据库）
- 注册账号：[turso.tech](https://turso.tech)

### 3. Vercel 账号（免费部署）
- 注册账号：[vercel.com](https://vercel.com)

---

## 📦 步骤 1：上传代码到 GitHub

### 1.1 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写：
   - Repository name: `omnistream`
   - Description: `OmniStream - 智能影视音乐聚合平台`
   - Public/Private: 选 **Public**（免费）
   - 不要勾选 "Add a README file"、"Add .gitignore" 等
3. 点击 **Create repository**

### 1.2 推送到 GitHub

在 `d:\影音` 目录下，执行以下命令（替换你的用户名）：

```bash
git remote add origin https://github.com/你的用户名/omnistream.git
git branch -M main
git push -u origin main
```

如果提示登录，用你的 GitHub 账号登录即可。

---

## 🗄️ 步骤 2：创建 Turso 数据库

### 2.1 注册/登录 Turso

1. 访问 https://turso.tech 注册/登录
2. 点击 **Create Database**
3. 填写：
   - Name: `omnistream`
   - Group: `default`（保持默认）
4. 点击 **Create database**

### 2.2 获取连接信息

创建成功后，点击 **Connect** → **Generate Token**：

1. **数据库 URL**: 复制 `libsql://omnistream-你的用户名.turso.io`
2. **Token**: 点击 **Generate token**，复制完整的 token（以 `ey` 开头）

把这两个信息保存好，后面 Vercel 要用到。

---

## 🌐 步骤 3：部署到 Vercel

### 3.1 导入项目

1. 访问 https://vercel.com/new
2. 点击 **Continue with GitHub** 登录
3. 在列表中找到 `omnistream`，点击 **Import**
4. 配置项目：
   - Project Name: `omnistream`（可以自己改）
   - Framework Preset: **Vite**（自动识别）
   - Root Directory: `./`（保持默认）
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.2 添加环境变量

在 **Environment Variables** 部分，点击 **Add Environment Variable**，添加：

| Key | Value |
|-----|-------|
| `TURSO_DATABASE_URL` | 你的 Turso 数据库 URL（`libsql://omnistream-xxx.turso.io`） |
| `TURSO_AUTH_TOKEN` | 你的 Turso Token |
| `JAMENDO_CLIENT_ID` | `b9e8f6d3`（演示用，可选） |
| `TMDB_API_KEY` | `2dca580c2a14b55200e784d157207b4d`（演示用，可选） |

**注意**: 可选的 API 密钥是演示用的，建议你去官网申请自己的免费 Key：
- Jamendo: https://developer.jamendo.com/
- TMDB: https://www.themoviedb.org/settings/api

### 3.3 部署

点击 **Deploy**，等待 2-3 分钟...

部署成功后，Vercel 会给你分配一个域名，例如：
- `https://omnistream-xyz.vercel.app`

---

## ✅ 验证部署

### 测试 API 健康

访问你的部署域名 + `/api/health`，例如：
```
https://omnistream-xyz.vercel.app/api/health
```

应该返回：
```json
{"success":true,"message":"ok","version":"OmniStream v2.0"}
```

### 访问主页

访问你的部署域名：
```
https://omnistream-xyz.vercel.app
```

应该能看到 OmniStream 主页！

---

## 🔗 自定义域名（可选）

### 添加域名

1. 在 Vercel Dashboard → 你的项目 → **Settings** → **Domains**
2. 点击 **Add**，输入你的域名（例如：`www.jsst.cc`）
3. Vercel 会自动帮你配置 DNS

### 配置 DNS

登录你的域名服务商（如阿里云、腾讯云、Cloudflare）：
1. 添加 **CNAME 记录**：
   - Host: `www`
   - Value: `cname.vercel-dns.com`
2. 添加 **A 记录**（如果要根域名）：
   - Host: `@`
   - Value: `76.76.21.21`

等 1-5 分钟 DNS 生效，Vercel 会自动申请 HTTPS 证书。

---

## 🔧 Vercel Cron 定时任务

你的 [vercel.json](file:///d:/影音/vercel.json) 已经配置好 4 个 Cron 任务：

| 任务 | 时间（UTC） | 说明 |
|------|-------------|------|
| `/api/cron/collect` | `0 2 * * *` | 每天 2 点采集内容 |
| `/api/cron/rankings` | `0 3 * * *` | 每天 3 点生成排行榜 |
| `/api/cron/recommendations` | `0 4 * * 1` | 每周一 4 点计算推荐 |
| `/api/cron/health-check` | `0 */4 * * *` | 每 4 小时检查接口健康 |

这些会自动执行，无需额外配置。

---

## 💡 常见问题

### Q: 数据库没数据？
A: 第一次部署后，手动触发采集：
   1. 访问部署网站
   2. 点击侧边栏「源管理」
   3. 点击「采集音乐」和「采集影视」

### Q: 定时任务不执行？
A: Vercel Cron 需要部署到 Production 才会生效（Preview 不会）。

### Q: Vercel 免费额度够用吗？
A: 完全够！Vercel 免费层：
- 100GB/月 带宽
- Serverless 函数无限调用
- Cron 任务免费

### Q: 如何备份数据库？
A: Turso 会自动备份。或者在 Turso Dashboard → 你的数据库 → **Backups** 手动备份。

---

## 🎉 恭喜！

你现在拥有了一个完全免费运行的智能影视音乐聚合站！

访问地址：https://你的域名

有问题随时查 Vercel Logs：
Vercel Dashboard → 你的项目 → **Logs**
