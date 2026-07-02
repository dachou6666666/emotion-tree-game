# 共生树 · Emotion Tree Game

给 ChatGPT / Codex / Cursor 看的项目说明。请以后按本文件理解当前项目结构，不要再按早期 EZ-Tree 原型路线修改。

## 项目是什么

这是一个本地运行的治愈系关系养成游戏原型。用户共同守护一棵 3D 共生树，用“今日照顾”“心结虫”“共同记忆果子”和“成长轨迹”来表达伴侣 / 家庭关系中的照顾、难受、回应和修复。

项目目前是前端原型，无后端。业务数据保存在浏览器 `localStorage`，key 为 `emotion-tree-game:v1`。

## 当前真实技术栈

- Vanilla JavaScript：负责业务逻辑、页面外壳、localStorage 状态、事件绑定和 HTML 字符串渲染。
- React + TypeScript：负责 3D 游戏场景入口和 R3F 组件。
- three / @react-three/fiber / @react-three/drei：负责 WebGL Canvas、灯光、相机、阴影、3D 地面、角色、粒子和 GLB 模型加载。
- framer-motion：负责部分 HUD 动效。
- Vite：负责把 `src/main.tsx` 和 `src/components/game/` 打包成 `dist/game-scene.js`。
- 真实树模型：位于 `public/assets/models/trees/*.glb`，授权记录见 `ASSET_LICENSES.md`。

## 当前运行方式

先构建 3D 场景：

```powershell
npm run build
```

再从工作区根目录启动本地静态服务器：

```powershell
cd ..
python -m http.server 5174 --bind 0.0.0.0
```

访问：

```text
http://localhost:5174/emotion-tree-game/
```

开发测试入口：

```text
http://localhost:5174/emotion-tree-game/?dev=1
```

`?dev=1` 才显示成长测试按钮和树模型候选选择器。正式体验里不要暴露这些开发工具。

## 核心文件职责

| 文件 | 当前职责 |
|---|---|
| `index.html` | 页面入口，加载 `styles.css`、`app.js`、`dist/game-scene.js`。 |
| `app.js` | 业务逻辑主文件：用户、登录、今日照顾、心结虫、回应、记忆果、成长值、时间推进、localStorage、HTML 外壳渲染、向 3D 场景传入 `sceneData`。 |
| `styles.css` | 页面外壳、游戏 HUD、响应式布局、面板、按钮、列表、3D Canvas 容器样式。 |
| `src/main.tsx` | 扫描 `.game-scene-root[data-scene]`，把 Vanilla JS 生成的 sceneData 挂载到 React `GameScene`。 |
| `src/components/game/GameScene.tsx` | React Three Fiber 3D 场景总入口：Canvas、相机、灯光、地面、角色、树、粒子、场景 HUD、成长反馈触发。 |
| `src/components/game/TreeModel.tsx` | 加载 `public/assets/models/trees/*.glb`，设置阴影，处理树点击摇晃、心结虫/记忆果挂件、fallback low-poly 树、成长阶段淡入淡出。 |
| `src/components/game/treeGrowth.ts` | 独立成长视觉计算：growthPercent、growthStage、stageProgress、targetScale、trunkScale、crownScale、leafUnfold、crownY。 |
| `src/components/game/CharacterModel.tsx` | 低多边形 / Q 版 3D 角色模型。 |
| `src/components/game/FloatingParticles.tsx` | 场景漂浮粒子。 |
| `src/components/game/GrowthEffects.tsx` | 点击树、今日照顾后的光圈、粒子和浮动成长文字。 |
| `src/components/game/types.ts` | Vanilla JS 传入 React 3D 场景的数据结构。 |
| `ASSET_LICENSES.md` | 3D 模型来源和授权记录。 |
| `DEVELOPMENT_HANDOFF.md` | 每次修改目标、改动文件、关键改动、构建结果和遗留问题记录。 |

## 历史遗留说明

- `tree3d.js`、`vendor/three/`、`vendor/ez-tree/` 属于早期 Three.js / EZ-Tree 原型遗留，不是当前主路线。
- 当前页面入口不再通过 `tree3d.js` 渲染主 3D 树。
- 后续新增或重构 3D 场景时，应优先遵守 React Three Fiber 架构，修改 `src/components/game/`，不要回到 EZ-Tree 路线。
- 如果保留遗留文件，只把它们视作历史参考；除非有明确迁移计划，不要把新功能接到遗留入口。

## 后续修改原则

- 不要破坏 `localStorage` 现有数据结构，除非同时写迁移逻辑。
- 不要把业务逻辑全部塞进 R3F 组件；业务状态仍由 `app.js` 管理，3D 场景通过 `sceneData` 接收展示数据。
- 不要继续把树模型大小调整当作主要优化方向；当前重点是体验信息架构和游戏化反馈。
- UI 体验应向“共生树关系养成游戏”靠拢，而不是“关系管理后台 + 中间 3D 树”。
- 开发测试能力必须隐藏在 `?dev=1` 后面。
- 提交前至少运行：

```powershell
npm run build
```

## 每次修改后的固定交付要求

每次修改完成后必须：

1. 更新 `DEVELOPMENT_HANDOFF.md`。
2. 写清楚本次目标、修改了哪些文件、关键改动、`npm run build` 是否通过、当前还存在什么问题。
3. 运行 `npm run build`。
4. `git commit`。
5. `git push` 到 GitHub 的 `origin/main`。

如果构建或推送失败，最终回复必须明确说明失败原因和当前状态。
