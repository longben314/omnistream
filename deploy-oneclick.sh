#!/bin/bash

set -e

echo "============================================="
echo "     OmniStream 一键部署脚本"
echo "============================================="
echo ""

GITHUB_TOKEN=""
GITHUB_USERNAME=""
TURSO_URL=""
TURSO_TOKEN=""

read -p "请输入您的 GitHub Personal Access Token: " GITHUB_TOKEN
read -p "请输入您的 GitHub 用户名: " GITHUB_USERNAME
read -p "请输入 Turso 数据库 URL: " TURSO_URL
read -p "请输入 Turso 认证 Token: " TURSO_TOKEN

echo ""
echo "正在部署 OmniStream..."
echo "------------------------"

npm install -g vercel @octokit/rest

cd /tmp
rm -rf omnistream-deploy
mkdir omnistream-deploy
cd omnistream-deploy

cat > deploy.js << 'DEPLOY_SCRIPT'
const { Octokit } = require('@octokit/rest');
const { spawnSync } = require('child_process');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function main() {
  console.log('1. 创建 GitHub 仓库...');
  try {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: 'omnistream',
      private: false,
      auto_init: false,
      description: 'OmniStream - 智能影视音乐聚合平台',
    });
    console.log('   ✓ 仓库创建成功');
  } catch (err) {
    if (err.status === 422) {
      console.log('   ✓ 仓库已存在');
    } else {
      throw err;
    }
  }

  console.log('2. 克隆现有项目...');
  spawnSync('git', ['clone', 'https://github.com/techfusion-lab/omnistream', '.'], { stdio: 'inherit' });
  
  console.log('3. 配置环境变量...');
  fs.writeFileSync('.env', `TURSO_DATABASE_URL=${TURSO_URL}\nTURSO_AUTH_TOKEN=${TURSO_TOKEN}\n`);
  
  console.log('4. 推送到 GitHub...');
  spawnSync('git', ['add', '.'], { stdio: 'inherit' });
  spawnSync('git', ['commit', '-m', 'Deploy OmniStream'], { stdio: 'inherit' });
  spawnSync('git', ['remote', 'add', 'origin', `https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/omnistream.git`], { stdio: 'inherit' });
  spawnSync('git', ['push', '-f', 'origin', 'main'], { stdio: 'inherit' });
  
  console.log('5. 部署到 Vercel...');
  const vercelResult = spawnSync('vercel', ['--prod', '--token', process.env.VERCEL_TOKEN], { stdio: 'inherit' });
  if (vercelResult.status !== 0) {
    throw new Error('Vercel 部署失败');
  }
  
  console.log('');
  console.log('🎉 部署完成！');
  console.log(`访问地址: https://omnistream-${GITHUB_USERNAME}.vercel.app`);
}

main().catch(err => {
  console.error('部署失败:', err.message);
  process.exit(1);
});
DEPLOY_SCRIPT

node deploy.js

echo ""
echo "============================================="
echo "      部署完成！"
echo "============================================="
echo ""
echo "访问地址: https://omnistream-${GITHUB_USERNAME}.vercel.app"
echo ""
echo "域名解析配置:"
echo "1. 在域名服务商添加 CNAME 记录"
echo "   Host: www"
echo "   Value: cname.vercel-dns.com"
echo "2. 在 Vercel 添加域名: Settings -> Domains"
