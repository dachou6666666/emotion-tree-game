# 共生树 · 夫妻关系花园

给 ChatGPT / Codex / Cursor 看的项目说明。

## 项目是什么

本地前端 SPA（Vanilla JS + Three.js），无后端。数据保存在浏览器 `localStorage`（key: `emotion-tree-game:v1`）。

## 核心文件

| 文件 | 作用 |
|------|------|
| `index.html` | 入口，import map 指向 `./vendor/three/build/three.module.js` |
| `app.js` | 游戏逻辑、UI 渲染、localStorage 读写 |
| `tree3d.js` | Three.js + EZ-Tree 3D 场景 |
| `styles.css` | 全部 UI 样式 |
| `vendor/three/` | 本地 Three.js |
| `vendor/ez-tree/` | EZ-Tree 程序化真实树库 |
| `assets/` | 图片等静态资源 |

## 本地启动

```powershell
cd ..
python -m http.server 5174 --bind 0.0.0.0
```

访问：`http://localhost:5174/emotion-tree-game/`

## 玩法摘要

- 夫妻/家庭成员共同守护一棵「共生树」
- 吐槽虫、日常维护、成长、四种树形、四种角色
- 7 天未处理虫子扣血；全员维护有共同生长奖励

## 修改时注意

- 尽量保持纯前端、无构建依赖的运行方式（`index.html` 直接可用）
- 3D 树用 EZ-Tree，树形映射在 `tree3d.js` 的 `presetForShape()`
- 改 UI 先看 `styles.css` 和 `app.js` 的 `renderTreePanel()` / `renderGardenParty()`
- 不要提交 `.env`、密钥、`node_modules/`

## GitHub 自动同步

- 脚本：`scripts/sync-to-github.ps1`
- 安装：`scripts/install-github-sync.ps1`（创建 GitHub 仓库 + 计划任务每 10 分钟推送）
- 日志：`.github-sync.log`
