# Development Handoff

REMOTE_SYNC_CHECK_2026_07_02

本文件用于记录每次修改的目标、涉及文件、验证结果和待审查问题，方便交给 GPT / Codex / Cursor 继续分析。

## 记录格式

```text
日期：
本次目标：
修改了哪些文件：
关键改动：
npm run build 是否通过：
当前还存在什么问题：
```

## 固定交付约定

- 以后每次改完项目，都要先更新本文件。
- 每次记录必须写清楚：本次目标、修改了哪些文件、关键改动、`npm run build` 是否通过、当前还存在什么问题。
- 每次完成修改后，都要提交到 Git，并推送到 GitHub 的 `origin/main`。
- 如果因为网络、GitHub 权限、构建失败等原因无法推送，必须在最终回复里明确说明原因和当前状态。

---

## 2026-07-02 远端 R3F 文档同步强校验

### 本次目标

- 按用户要求对本地 HEAD、`origin/main` 和 GitHub raw 内容做远端强校验。
- 在 `AGENTS.md` 顶部加入 `R3F_ARCHITECTURE_CONFIRMED_2026_07_02`。
- 在 `DEVELOPMENT_HANDOFF.md` 顶部加入 `REMOTE_SYNC_CHECK_2026_07_02`。
- 重新提交并推送，确保 GitHub raw 能直接看到标记。

### 修改了哪些文件

- `AGENTS.md`
- `DEVELOPMENT_HANDOFF.md`

### 关键改动

- 为 R3F 架构文档增加明确同步确认标记，方便外部 GPT 直接通过 raw 文件判断远端内容是否更新。
- 记录本次远端同步强校验流程，不涉及任何 UI 或业务功能修改。

### npm run build 是否通过

- 通过。
- Vite 仍提示 `dist/game-scene.js` chunk 超过 500 kB，这是现有 Three.js / React Three Fiber 打包体积提示，不影响本次构建结果。

### 当前还存在什么问题

- 推送后还需要使用 `curl.exe -L` 直接读取 GitHub raw，再确认两个标记都能从远端 main 看到。

---

## 2026-07-02 项目说明一致化与体验重构准备

### 本次目标

- 修正 `AGENTS.md` 与当前真实技术栈不一致的问题。
- 明确当前主路线是 Vanilla JS 业务外壳 + React Three Fiber 3D 场景 + Vite 构建，不再把 EZ-Tree 作为当前主路线。
- 分析当前页面为什么仍然像“关系管理后台 + 中间 3D 树”，输出下一阶段文件级体验重构计划。
- 本次只做文档和计划，不继续优化树模型，不新增功能，不大面积改业务代码。

### 修改了哪些文件

- `AGENTS.md`
- `DEVELOPMENT_HANDOFF.md`

### 关键改动

- `AGENTS.md` 已更新为当前架构说明：
  - `app.js` 负责用户、登录、今日照顾、心结虫、回应、记忆果、成长值、时间推进、localStorage、HTML 外壳渲染，以及向 3D 场景传入 `sceneData`。
  - `src/components/game/` 负责 React Three Fiber 3D 游戏场景。
  - `GameScene.tsx` 负责 Canvas、相机、灯光、地面、角色、树、粒子、场景 HUD 和成长反馈触发。
  - `TreeModel.tsx` 负责加载 GLB 树模型、阴影、点击摇晃、心结虫/记忆果挂件、fallback low-poly 树和成长阶段淡入淡出。
  - `treeGrowth.ts` 负责成长百分比到视觉参数的独立计算。
  - `tree3d.js`、`vendor/three/`、`vendor/ez-tree/` 被标记为历史遗留，不作为后续 3D 主路线。
- 明确后续修改应优先遵守 React Three Fiber 架构。
- 明确每次修改后都必须更新本文件、运行 `npm run build`、commit 并 push。

### 当前体验问题分析

1. 哪些 UI 让页面像后台：
   - `app.js` 里的 `renderApp()` 仍然是左栏、中心、右栏、底部四区的信息面板布局。
   - `renderGuardianPanel()` 仍然像账号/成员管理列表，承担切换账号和成员状态展示。
   - `renderBugPanel()` 使用 textarea、select、提交按钮和卡片列表，视觉像工单/表单管理。
   - `renderFruitPanel()` 和 `renderTimelinePanel()` 仍然是列表型信息管理，而不是场景中的奖励或回忆展示。
   - `styles.css` 的 `.relationship-layout .panel`、`.bug-card`、`.fruit-card`、`.response-card` 仍然保留大量卡片和列表框架。
2. 哪些文案太功能化：
   - 顶部和场景 HUD 中仍有“成长 39%”“关系温度 100°”等仪表盘式数字。
   - “今日照顾”“等待被看见的心结”“今日回应”比旧文案温和，但仍偏栏目标题。
   - 心结表单里的“我希望对方怎么回应”仍像记录表单，缺少游戏里的行动感。
3. 哪些按钮应该改成游戏化动作：
   - “给树浇水 / 留一束光 / 写一句感谢”应从普通按钮变成树下可点击仪式动作。
   - “放下一只心结虫”应变成把一个发光小虫放到树旁的场景动作。
   - “回应这个心结”应触发虫子消散、树叶变亮、共同记忆生成的反馈。
   - “采摘记忆”应变成点击树上果子或底部奖励槽的采摘动作。
4. 哪些信息应该移动到 3D 场景反馈：
   - 心结虫数量、颜色、紧急程度，应更多显示在树旁虫子身上，而不是只在右侧列表。
   - 成熟记忆果应优先显示在树冠或场景奖励层，而不是只在底部果子列表。
   - 今日照顾完成后的“树记住了”应以角色小动作、光点、浮动文字表现。
   - 回应心结后的“被看见了”应以虫子离开、树叶变亮、粒子扩散表现。
5. 哪些开发测试功能应该只在 `?dev=1` 显示：
   - 成长预览按钮。
   - 树模型候选选择器。
   - 未来任何调试坐标、模型 scale、灯光参数、场景数据 JSON、性能统计。
6. 如何让树成为绝对主视觉：
   - `styles.css` 应让 `.tree-focus` 和 `.tree-scene.game-scene-shell` 占据首屏绝大多数面积。
   - 左右栏应改成浮动小 HUD、抽屉或底部操作栏，不再以三栏后台方式长期占位。
   - 顶部状态只保留一句关系状态，不堆叠多个标签。
   - 场景内 HUD 应减少数字，强化氛围、阶段名和即时反馈。
7. 如何让核心机制更像游戏：
   - 心结虫：从列表管理改成“树旁出现的小生物”，右侧只作为当前选中详情或回应抽屉。
   - 今日照顾：从按钮表单改成“树下仪式动作栏”，点击后角色动作和场景粒子是主反馈。
   - 共同记忆果子：从果子列表改成“树上可采摘奖励 + 底部回忆收藏槽”。

### 下一阶段文件级重构计划

1. `app.js`
   - 保留现有业务逻辑和 localStorage 数据。
   - 将 `renderApp()` 的常驻三栏布局改为：全屏 3D 场景主画面 + 左下今日照顾动作栏 + 右侧可收起心结详情抽屉 + 底部记忆果快捷栏。
   - 将 `renderBugPanel()` 拆成“放下心结入口”和“当前心结详情”，避免右侧长期显示完整表单和列表。
   - 将 `renderFruitPanel()` 改成底部奖励槽摘要，详细记录放进抽屉或二级层。
   - 在 `buildTreeSceneData()` 中补充更适合场景表现的数据，例如心结文本摘要、果子成熟状态、最近反馈事件，但不改变核心数据存储结构。
2. `styles.css`
   - 把 `.relationship-layout` 从固定三栏改为游戏 HUD 层级。
   - 弱化 `.panel` 的后台卡片视觉，更多使用浮动玻璃 HUD、底部动作栏和可收起抽屉。
   - 让 `.tree-focus` / `.tree-scene.game-scene-shell` 成为首屏绝对主视觉。
   - 移动端优先：底部动作栏、右侧抽屉改成底部 sheet，避免左右栏挤压 3D 场景。
3. `src/components/game/GameScene.tsx`
   - 保持当前 Canvas、灯光、地面、角色、树模型架构。
   - 增加场景事件入口，让今日照顾、回应心结、采摘果子可以触发不同反馈。
   - 减少场景 HUD 数字展示，把状态变化更多交给光效、粒子、角色动作。
4. `src/components/game/TreeModel.tsx`
   - 不继续优化树模型和模型大小。
   - 保留 GLB 加载、成长动画和 fallback。
   - 后续只在必要时优化心结虫/记忆果挂件的可点击表现。
5. `src/components/game/GrowthEffects.tsx`
   - 扩展为不同游戏事件的反馈层：今日照顾、回应心结、采摘记忆果。
   - 避免所有事件都只显示“+成长”。
6. `src/components/game/types.ts`
   - 增加场景反馈事件类型和心结/果子的展示字段。
   - 保持和 `app.js` 的 `sceneData` 边界清晰。

### npm run build 是否通过

- 通过。
- Vite 仍提示 `dist/game-scene.js` chunk 超过 500 kB，这是 Three.js / React Three Fiber 打包体积提示，不影响构建。

### 当前还存在什么问题

- 当前页面虽然已经比旧版更游戏化，但信息架构仍然保留三栏面板思维。
- 心结虫、今日照顾、共同记忆果子仍主要以列表和按钮呈现，场景反馈占比不够。
- `app.js` 体积较大，后续体验重构前最好先规划拆分边界。
- `dist/game-scene.js` 包体积较大，后续可考虑代码分割或调整构建策略。

---

## 2026-07-02 固定 GitHub 交付流程

### 本次目标

- 记录新的协作要求：以后每次修改完成后，都要更新 `DEVELOPMENT_HANDOFF.md`、提交 Git，并推送到 GitHub。

### 修改了哪些文件

- `DEVELOPMENT_HANDOFF.md`

### 关键改动

- 将原有记录格式改成用户指定的 5 项字段。
- 新增“固定交付约定”，明确每次修改后的文档、构建、提交和推送要求。

### npm run build 是否通过

- 通过。
- Vite 仍提示 `dist/game-scene.js` chunk 超过 500 kB，这是 Three.js / React Three Fiber 打包体积提示，不影响本次构建结果。

### 当前还存在什么问题

- 目前没有影响提交和推送的问题。
- 后续如果要优化构建体积，可以考虑代码分割或调整 Vite chunk 警告阈值。

## 2026-07-02 Git 仓库整理

### 修改目标

- 准备将 `emotion-tree-game` 推送到 GitHub。
- 补充 `.gitignore`，避免提交依赖、构建输出、缓存和临时文件。
- 更新 README，让项目说明和当前“共生树关系养成游戏”方向一致。
- 新增本交接文档，后续每次改动都可以继续追加记录。

### 修改文件

- `.gitignore`
- `README.md`
- `DEVELOPMENT_HANDOFF.md`

### 运行结果

- `git status -sb`：确认仓库位于 `main` 分支。
- `git log --oneline -5`：发现项目此前已经存在 Git 提交历史。
- 本次未删除任何现有功能文件。

### 待审查问题

- 当前仓库还没有配置 GitHub remote，需要在创建 GitHub 仓库后执行：

```powershell
git remote add origin https://github.com/<your-name>/emotion-tree-game.git
git push -u origin main
```

- `dist/` 被 `.gitignore` 忽略。GitHub 上的源码仓库需要通过 `npm run build` 重新生成构建产物。
- 如果以后要直接部署到 GitHub Pages，需要补充构建和发布流程。
