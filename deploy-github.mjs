import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

const REPO_NAME = 'omnistream';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('请设置 GITHUB_TOKEN 环境变量');
  console.error('获取方式: https://github.com/settings/tokens/new?scopes=repo');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getGitHubUser() {
  const { data } = await octokit.rest.users.getAuthenticated();
  return data.login;
}

async function createRepo(username: string) {
  try {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      private: false,
      auto_init: false,
      description: 'OmniStream - 智能影视音乐聚合平台',
    });
    console.log(`[OK] 仓库 ${username}/${REPO_NAME} 创建成功`);
  } catch (err: any) {
    if (err.status === 422) {
      console.log(`[OK] 仓库 ${username}/${REPO_NAME} 已存在`);
    } else {
      throw err;
    }
  }
}

async function uploadFile(username: string, filePath: string, content: Buffer) {
  const base64Content = content.toString('base64');
  const githubPath = filePath.replace(/\\/g, '/');

  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: username,
      repo: REPO_NAME,
      path: githubPath,
      message: `Add ${githubPath}`,
      content: base64Content,
    });
  } catch (err: any) {
    if (err.status === 422 || err.status === 409) {
      try {
        const { data: existingFile } = await octokit.rest.repos.getContent({
          owner: username,
          repo: REPO_NAME,
          path: githubPath,
        });

        if ('sha' in existingFile) {
          await octokit.rest.repos.createOrUpdateFileContents({
            owner: username,
            repo: REPO_NAME,
            path: githubPath,
            message: `Update ${githubPath}`,
            content: base64Content,
            sha: existingFile.sha,
          });
        }
      } catch {
        console.warn(`[WARN] Failed to update ${githubPath}`);
      }
    } else {
      console.warn(`[WARN] Failed to upload ${githubPath}: ${err.message}`);
    }
  }
}

const IGNORE_PATTERNS = [
  'node_modules', '.git', 'dist', 'data', '.trae',
  'node-v20.11.0-win-x64', 'node.zip', 'nodejs.zip',
  'mingit.zip', 'git', 'soundflix.db', 'soundflix.db-shm',
  'soundflix.db-wal', 'omnistream.db', 'omnistream.db-shm',
  'omnistream.db-wal', 'deploy-github.mjs', 'DEPLOY.md',
];

function shouldIgnore(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some(pattern => normalized.includes(`/${pattern}/`) || normalized.startsWith(`${pattern}/`) || normalized === pattern);
}

function getAllFiles(dir: string, baseDir: string = ''): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

    if (shouldIgnore(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function main() {
  const username = await getGitHubUser();
  console.log(`[OK] 登录 GitHub 用户: ${username}`);

  await createRepo(username);

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`[OK] 找到 ${files.length} 个文件需要上传`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(projectDir, file.replace(/\//g, path.sep));
    try {
      const content = fs.readFileSync(fullPath);
      await uploadFile(username, file, content);
      uploaded++;
      if (uploaded % 10 === 0) {
        console.log(`[PROGRESS] 已上传 ${uploaded}/${files.length} 个文件`);
      }
    } catch (err: any) {
      failed++;
      console.warn(`[FAIL] ${file}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n[DONE] 上传完成: 成功 ${uploaded}, 失败 ${failed}`);
  console.log(`\n仓库地址: https://github.com/${username}/${REPO_NAME}`);
  console.log(`\n下一步:`);
  console.log(`1. 访问 https://vercel.com/new`);
  console.log(`2. 导入 ${username}/${REPO_NAME} 仓库`);
  console.log(`3. Framework Preset 选择 "Vite"`);
  console.log(`4. Output Directory 设置为 "dist"`);
  console.log(`5. 点击 Deploy`);
}

main().catch(console.error);
