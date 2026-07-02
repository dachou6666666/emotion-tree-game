# 共生树情感游戏项目交接文档

生成日期：2026-07-02  
项目目录：`E:\codex项目测试\emotion-tree-game`  
用途：把当前项目的产品理念、业务规则、代码结构、3D 实现、成长系统、素材来源和待分析问题交给 GPT 继续分析。

---

## 1. 给 GPT 的分析提示词

你将分析一个名为“共生树”的网页情感养成游戏原型。它面向夫妻 / 伴侣 / 家庭成员，用游戏化方式记录日常维护、吐槽、回应、修复和共同成长。  

请重点分析：

1. 产品理念是否清晰，是否适合作为关系修复 / 伴侣沟通工具。
2. 游戏机制是否健康，是否会制造压力、内疚或误解。
3. 成长、血量、虫子、果子、每日维护这些规则是否合理。
4. 3D 场景、树模型、人物、HUD 的技术路线是否适合继续扩展。
5. 当前代码结构是否需要拆分、重构、上后端或引入数据库。
6. 连续成长动画系统是否设计合理。
7. 如果要做成正式产品，下一阶段优先级应该是什么。

不要只评价 UI 好不好看，也要评价产品伦理、互动机制、可维护性和后续商业化可能。

---

## 2. 产品理念

### 2.1 核心想法

“共生树”不是普通记录工具，而是一个治愈系网页养成游戏。

用户关系中的每个人都共同守护同一棵树。树代表关系本身，不属于单独某个人。关系被照顾时，树慢慢长大；关系中出现难受、委屈、误会时，可以把它具象化为“吐槽虫”；其他成员需要进入对方的领地或共生场景，把虫子抓走并回应。

### 2.2 设计隐喻

| 游戏元素 | 现实含义 |
|---|---|
| 共生树 | 夫妻 / 伴侣 / 家庭关系本身 |
| 日常维护 | 每日关心、感谢、倾听、表达善意 |
| 吐槽虫 | 难受、委屈、未被回应的问题 |
| 抓虫 | 认真回应对方的问题 |
| 果子 | 长期维护后产生的正向记忆和关系奖励 |
| 血量 | 关系健康度 |
| 成长百分比 | 关系共同投入的长期积累 |
| 树模型 | 用户对关系气质的选择，如稳重、温暖、童话感 |

### 2.3 设计目的

1. 把“吵架 / 责备”转化为“共同处理问题”。
2. 把抽象的情绪问题可视化，让双方更容易讨论。
3. 用游戏反馈鼓励正向互动，而不是只记录负面事件。
4. 让关系修复有仪式感和可见进度。

---

## 3. 当前功能范围

### 3.1 已实现功能

- 本地静态网站，当前通过 `http://localhost:5174/emotion-tree-game/` 打开。
- 默认两个成员账号：
  - `林夕 / 123456`
  - `周晨 / 123456`
- 用户可以登录、切换成员、加入新成员。
- 所有人共用一棵“共生树”。
- 每个成员每天正式维护一次。
- 维护后成长增加，并播放连续成长动画。
- 可以放置“吐槽虫”。
- 他人可以抓虫并回复。
- 虫子超过 7 天未处理会伤害树。
- 树有血量，默认 `100/100`。
- 树会结果，果子成熟后可采摘。
- 中间主画面是 React Three Fiber WebGL 3D 场景。
- 支持多个真实 GLB 树模型切换。
- 支持“测试明显长大”按钮，只演示动画，不保存真实进度。
- 所有数据保存在 `localStorage`。

### 3.2 当前不包含

- 后端数据库。
- 多设备同步。
- 真实账号注册 / 登录安全。
- 权限系统。
- 聊天系统。
- AI 自动分析情绪。
- 正式部署流程。

---

## 4. 技术栈

项目最初是静态 HTML / CSS / JS，后来在不破坏原有业务逻辑的前提下，把中间 3D 场景独立接入 React + Three。

### 4.1 前端与 3D

- 原业务外壳：Vanilla JavaScript
- 3D 场景：React
- WebGL：Three.js
- React Three：`@react-three/fiber`
- 辅助组件：`@react-three/drei`
- 动画辅助：`framer-motion`
- 构建：Vite
- 类型检查：TypeScript

### 4.2 资产处理

- GLB 模型来源：Quaternius / Poly Pizza
- 授权：Public Domain / CC0 1.0
- GLB 处理：`@gltf-transform/cli`
- 处理命令包含：
  - `prune`
  - `dedup`
  - `resize --width 1024 --height 1024`

---

## 5. 运行方式

项目目录：

```powershell
cd E:\codex项目测试\emotion-tree-game
```

安装依赖：

```powershell
npm install
```

构建 3D bundle：

```powershell
npm run build
```

开发模式：

```powershell
npm run dev:game
```

当前本地访问：

```text
http://localhost:5174/emotion-tree-game/
```

注意：当前页面由本地静态服务器提供时，GLB 通过绝对路径 `/assets/models/trees/...` 加载。为了适配当前 Python 静态服务，项目外层根目录也同步了一份 `E:\codex项目测试\assets\models\trees\*.glb`。

---

## 6. 文件结构与源码索引

### 6.1 顶层文件

```text
emotion-tree-game/
├─ index.html
├─ app.js
├─ styles.css
├─ tree3d.js
├─ package.json
├─ package-lock.json
├─ vite.config.ts
├─ tsconfig.json
├─ ASSET_LICENSES.md
├─ README.md
├─ GPT_ANALYSIS_HANDOFF.md
├─ public/
│  └─ assets/models/trees/*.glb
├─ dist/
│  ├─ game-scene.js
│  └─ assets/models/trees/*.glb
├─ src/
│  └─ components/game/
│     ├─ GameScene.tsx
│     ├─ TreeModel.tsx
│     ├─ CharacterModel.tsx
│     ├─ FloatingParticles.tsx
│     ├─ GrowthEffects.tsx
│     ├─ treeGrowth.ts
│     └─ types.ts
└─ screenshots/
```

### 6.2 关键文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 静态入口，加载 `app.js`、`styles.css` 和构建后的 `dist/game-scene.js` |
| `app.js` | 主业务逻辑，负责登录、成员、维护、虫子、果子、localStorage、渲染 HTML |
| `styles.css` | 全站样式、游戏 HUD、3D 场景容器、模型选择区 |
| `tree3d.js` | 旧 3D 实现遗留文件，目前不再由 `index.html` 加载 |
| `src/main.tsx` | React 3D 场景挂载入口，读取 `.game-scene-root` 的 `data-scene` |
| `GameScene.tsx` | React Three Fiber 主场景，天空、灯光、地面、HUD、角色、树 |
| `TreeModel.tsx` | GLB 树模型加载、切换、连续成长动画、阶段淡入淡出 |
| `treeGrowth.ts` | 独立成长计算：stage、stageProgress、targetScale、crownScale |
| `GrowthEffects.tsx` | 成长光环、粒子、浮字 |
| `CharacterModel.tsx` | 3D / low-poly Q 版角色 |
| `ASSET_LICENSES.md` | 3D 模型授权记录 |

---

## 7. 业务数据模型

当前所有状态保存在：

```js
localStorage["emotion-tree-game:v1"]
```

### 7.1 默认状态

核心字段来自 `app.js`：

```js
{
  version: 2,
  today,
  startedDay: today,
  sessionUserId: null,
  tree: makeSharedTree(today),
  timeline: [...],
  users: [
    makeUser("林夕", "123456", "#4f8f62", "listener"),
    makeUser("周晨", "123456", "#4a8aa6", "guardian")
  ]
}
```

### 7.2 树数据

```js
{
  id: "shared-tree",
  name: "我们的共生树",
  shape: "heritage",
  model: "common-tree",
  hp: 100,
  careCount: 0,
  growthPoints: 8,
  careLog: {},
  fruits: [...],
  bugs: [...]
}
```

### 7.3 用户数据

```js
{
  id,
  name,
  password,
  color,
  avatar
}
```

### 7.4 虫子数据

虫子代表未解决的难受或吐槽：

```js
{
  id,
  text,
  need,
  authorId,
  authorName,
  createdDay,
  expiresDay,
  status,
  caughtBy,
  caughtByName,
  caughtDay,
  reply,
  damageApplied
}
```

---

## 8. 核心业务规则

### 8.1 每日维护

当前规则：

1. 每个成员每天只能正式维护一次。
2. 日常维护按钮有三种表达形式：
   - 浇水
   - 晒太阳
   - 写感谢
3. 三个按钮本质都代表“今日正式维护”。
4. 任意一个点击后，当天三个按钮都禁用。
5. 维护成功后：
   - `growthPoints += 5`
   - `hp += 1`
   - 触发连续成长动画
   - 触发绿色光环、粒子、`+5 成长`

### 8.2 全员维护奖励

如果当天所有成员都至少维护过一次：

```js
addGrowthPoints(tree, 3);
tree.hp = clamp(tree.hp + 2, 0, 100);
```

### 8.3 虫子伤害

如果虫子超过 7 天没有被回应：

```js
tree.hp = clamp(tree.hp - 1, 0, 100);
addGrowthPoints(tree, -1);
```

### 8.4 抓虫

其他成员可以抓虫并回复。抓虫成功：

```js
tree.hp = clamp(tree.hp + 2, 0, 100);
addGrowthPoints(tree, 2);
```

### 8.5 果子

维护次数达到一定数量会生成果子。果子成熟后可以采摘，采摘恢复关系血量并增加成长。

---

## 9. 3D 场景架构

### 9.1 静态业务页面如何接入 React

`app.js` 渲染 HTML 时，会生成：

```html
<div class="tree-scene game-scene-shell" data-scene="...">
  <div class="game-scene-root" data-scene="..."></div>
  <div class="tree-scene-loading game-scene-fallback">3D 游戏场景加载中</div>
</div>
```

`src/main.tsx` 会扫描 `.game-scene-root`，解析 `data-scene`，然后挂载：

```tsx
root.render(<GameScene data={data} />);
```

这样做的原因：

1. 不重写原有 `app.js` 业务逻辑。
2. 只让中间 3D 场景由 React Three Fiber 管理。
3. 旧页面仍可继续用字符串模板快速迭代。

### 9.2 GameScene 组成

`GameScene.tsx` 包含：

- WebGL Canvas
- Sky
- Fog
- AmbientLight
- HemisphereLight
- DirectionalLight
- ContactShadows
- Ground
- TreeModel
- CharacterModel
- FloatingParticles
- GrowthEffects
- HUD

---

## 10. 连续成长系统

### 10.1 为什么要做连续成长

用户明确要求：树不能到某个阶段突然变大，而是每天维护后慢慢、连续地长大。  

因此当前成长系统设计为：

1. 业务层只保存最终成长值。
2. 渲染层接收 `fromPercent` 和 `toPercent`。
3. 3D 层内部用 `useFrame` 平滑插值。
4. 阶段变化时做双层模型淡入淡出。

### 10.2 成长阶段

`treeGrowth.ts` 里定义了四个阶段：

| 范围 | 阶段 |
|---|---|
| 0-20% | seedling |
| 21-50% | sapling |
| 51-80% | young |
| 81-100% | mature |

### 10.3 阶段内部连续缩放

示例逻辑：

```ts
export function getStageProgress(growthPercent: number) {
  const percent = clampGrowthPercent(growthPercent);
  const stage = getStageConfig(percent);
  return (percent - stage.min) / (stage.max - stage.min);
}
```

然后基于 `stageProgress` 计算：

```ts
targetScale
trunkScale
crownScale
leafUnfold
crownY
```

### 10.4 TreeModel 内部动画

`TreeModel.tsx` 中核心做法：

```ts
animatedGrowth.current = THREE.MathUtils.damp(
  animatedGrowth.current,
  targetGrowthRef.current,
  damping,
  delta
);
```

每一帧根据 `animatedGrowth.current` 重新计算视觉参数：

```ts
const visual = getTreeGrowthVisual(animatedGrowth.current);
groupRef.current.scale.setScalar(visual.targetScale * healthScale);
```

### 10.5 跨阶段淡入淡出

当成长从一个阶段进入下一个阶段，例如 `49% -> 52%`：

1. 旧阶段模型作为 `previousStage`。
2. 新阶段模型作为 `currentStage`。
3. 旧阶段 opacity 从 1 到 0。
4. 新阶段 opacity 从 0 到 1。
5. 同时播放成长光环和粒子。

这避免了模型突然闪烁。

---

## 11. 树模型选择系统

用户希望下载多个树模型用于比较，所以当前接入了 7 个候选 GLB。

### 11.1 模型列表

| ID | 中文名 | 文件 |
|---|---|---|
| `common-tree` | 经典阔叶树 | `/assets/models/trees/common-tree.glb` |
| `pine-wide` | 宽冠松树 | `/assets/models/trees/pine-wide.glb` |
| `pine-tall` | 高挑松树 | `/assets/models/trees/pine-tall.glb` |
| `pine-compact` | 紧凑松树 | `/assets/models/trees/pine-compact.glb` |
| `twisted-emerald` | 弯枝绿树 | `/assets/models/trees/twisted-emerald.glb` |
| `twisted-round` | 圆冠弯枝树 | `/assets/models/trees/twisted-round.glb` |
| `twisted-amber` | 暖色弯枝树 | `/assets/models/trees/twisted-amber.glb` |

### 11.2 选择逻辑

`app.js` 中保存：

```js
tree.model = model.id;
```

然后传给 3D：

```js
treeModel: getTreeModel(tree.model).id,
treeModelUrl: getTreeModel(tree.model).url
```

`TreeModel.tsx` 中加载：

```tsx
const gltf = useGLTF(activeModelUrl);
```

所有模型共用同一套成长缩放系统，所以都能“随时长大”。

---

## 12. 测试按钮

为了肉眼明显测试成长动画，页面提供：

```text
测试明显长大
```

特点：

1. 只演示动画。
2. 不保存成长进度。
3. 不修改 `growthPoints`。
4. 会从当前成长值临时跳到更高目标值进行平滑动画。
5. 可用于比较不同树模型的成长表现。

核心逻辑：

```js
ui.growthPreview = {
  id: `test-${Date.now()}-${Math.round(Math.random() * 100000)}`,
  fromPercent,
  toPercent,
  amount: toPercent - fromPercent,
  fromStage: growthStageId(fromPercent),
  toStage: growthStageId(toPercent),
  reason: "test",
};
render();
```

---

## 13. 资产来源和授权

所有树模型都来自 Quaternius，经 Poly Pizza 单模型页面下载。授权记录在：

```text
ASSET_LICENSES.md
```

授权：

```text
Public Domain / CC0 1.0
https://creativecommons.org/publicdomain/zero/1.0/
```

原始包：

```text
https://quaternius.com/packs/stylizednaturemegakit.html
```

Poly Pizza 单模型页面：

- https://poly.pizza/m/qZtx0AHhcy
- https://poly.pizza/m/rfnxJv0Rqa
- https://poly.pizza/m/igSu0cPoBz
- https://poly.pizza/m/79gmlLnweB
- https://poly.pizza/m/9aWlx82xUf
- https://poly.pizza/m/GVTsMmuzv7
- https://poly.pizza/m/8oraKn9m0x

---

## 14. 验证记录

已执行：

```powershell
node --check app.js
npx tsc --noEmit
npm run build
```

均通过。

浏览器验证过：

1. 7 个 GLB 模型路径返回 200。
2. 页面逐个切换模型正常加载。
3. 控制台输出：

```text
[EmotionTree] loaded tree model /assets/models/trees/...
```

4. “测试明显长大”仍然触发 `39% -> 69%` 的平滑成长动画。
5. 测试按钮不修改真实 `growthPoints`。

验证截图在：

```text
screenshots/tree-model-options-selector.png
screenshots/tree-model-option-growth.png
screenshots/smooth-growth-final.png
screenshots/test-growth-button.png
```

---

## 15. 当前代码设计的缘由

### 15.1 为什么不是一次性改成完整 React 应用

原项目已经有大量业务逻辑在 `app.js` 中：

- localStorage 状态迁移
- 用户登录
- 维护规则
- 虫子规则
- 果子规则
- 页面模板

为了降低风险，没有一次性重写成 React，而是把最需要游戏感的中间主场景拆出来，用 React Three Fiber 接管。

这样可以：

1. 保留现有业务逻辑。
2. 快速验证 3D 游戏化方向。
3. 后续再逐步迁移到 React 状态管理或后端。

### 15.2 为什么成长逻辑独立成 `treeGrowth.ts`

因为成长规则以后一定会继续改。  

如果成长计算写死在 `GameScene` 或 `TreeModel`，后续很难维护。现在拆成：

```text
业务成长点：app.js
成长视觉计算：treeGrowth.ts
3D 视觉动画：TreeModel.tsx
```

这使得产品规则和视觉规则相对解耦。

### 15.3 为什么模型切换只换模型，不换成长系统

用户希望“每棵树都能随时长大”。  

因此模型只是皮肤，成长值仍然统一由 `growthPercent` 控制。  

所有模型都会经过：

```text
growthPercent -> stageProgress -> targetScale -> animatedScale
```

### 15.4 为什么测试成长不保存

测试按钮是为了肉眼验证动画。如果保存，会污染真实关系进度。  

所以测试按钮只写入临时 UI 状态：

```js
ui.growthPreview
```

渲染后会清掉，不写入 localStorage。

---

## 16. 目前代码的主要风险

### 16.1 `app.js` 太大

`app.js` 目前约 60 KB，包含业务、模板、事件绑定、数据迁移。  
后续如果继续扩展，建议拆分：

- `state.js`
- `treeRules.js`
- `bugRules.js`
- `renderPanels.js`
- `events.js`

### 16.2 Vanilla JS 与 React 混合

当前是过渡架构。  
优点是改动风险低；缺点是 React 场景每次主页面重绘都会重新挂载。

未来正式化时建议：

1. 改成完整 React 应用。
2. 用 Zustand 管理状态。
3. 用后端 API 保存数据。

### 16.3 localStorage 不适合真实多人

当前只是本地演示。  
夫妻双方真实使用时，必须有后端：

- 用户系统
- 家庭 / 关系空间
- 成员权限
- 数据同步
- 冲突处理
- 数据备份

### 16.4 情感产品的伦理风险

“虫子 7 天未回应扣血”可能制造压力。  
需要 GPT 重点分析是否会让用户觉得被惩罚、被指责。

可替代方案：

- 扣血改成“树叶暗淡”。
- 不惩罚个人，只提示“有问题等待照顾”。
- 提供“暂停期”“冷静期”“我现在还没准备好回应”机制。

### 16.5 模型视觉统一性

当前 7 个模型都是 Quaternius 风格，但不同模型高度和冠幅差异较大。  
后续可能需要为每个模型单独设置：

```ts
baseScale
verticalOffset
crownOffset
ornamentAnchor
cameraFraming
```

---

## 17. 建议 GPT 继续分析的问题

### 产品层

1. “共生树”是否比“个人树”更适合夫妻关系？
2. 虫子机制是否会鼓励表达，还是会放大矛盾？
3. 7 天时效是否合理？
4. 血量是否应该存在？
5. 每日维护是否应该强提醒？
6. 是否需要“双方都确认修复完成”才算抓虫成功？

### 游戏层

1. 成长是否应该只靠维护，还是抓虫和果子也要有可见成长？
2. 果子成熟后应该带来什么实际奖励？
3. 是否需要关系等级、季节、天气？
4. 是否应该加入共同任务，比如“本周一次不打断倾听”？

### 技术层

1. 当前 Vanilla + React Three 的混合架构是否继续保留？
2. 是否应该整体迁移 React / Next.js？
3. 后端用什么更合适：Supabase、Firebase、Node、Laravel？
4. 3D 模型是否应该使用 morph target，而不是整体缩放？
5. 是否需要用 Draco / Meshopt 压缩并配置解码器？
6. 是否需要移动端性能分级？

### UX 层

1. 候选树模型选择放在维护区是否合理？
2. 测试成长按钮上线版是否隐藏？
3. 右侧吐槽虫是否应该更像任务栏？
4. 是否需要情绪安全提示？
5. 是否需要把“吐槽”改成更温和的词，例如“心结虫”？

---

## 18. 后续开发建议

### 第一优先级

1. 明确产品规则，避免机制伤害用户关系。
2. 把 `app.js` 拆分。
3. 将树模型参数化，不同模型单独设置大小和挂点。
4. 增加移动端性能优化。
5. 增加保存 / 同步方案设计。

### 第二优先级

1. 引入真实后端。
2. 加入家庭邀请码。
3. 加入成员独立账号。
4. 加入消息通知。
5. 加入 AI 辅助总结，但不能替代用户表达。

### 第三优先级

1. 做成完整 WebGL 小游戏界面。
2. 加入季节变化。
3. 加入更多角色形象。
4. 加入树下互动动作。
5. 加入关系纪念日和共同成就。

---

## 19. 交给 GPT 时建议一并上传的源码

如果要让 GPT 深度分析代码，请上传以下文件：

```text
app.js
styles.css
index.html
package.json
vite.config.ts
tsconfig.json
ASSET_LICENSES.md
src/main.tsx
src/components/game/GameScene.tsx
src/components/game/TreeModel.tsx
src/components/game/treeGrowth.ts
src/components/game/GrowthEffects.tsx
src/components/game/CharacterModel.tsx
src/components/game/FloatingParticles.tsx
src/components/game/types.ts
```

如果 GPT 需要分析素材授权，也上传：

```text
public/assets/models/trees/*.glb
ASSET_LICENSES.md
```

如果 GPT 需要分析视觉效果，也上传：

```text
screenshots/tree-model-options-selector.png
screenshots/smooth-growth-final.png
screenshots/test-growth-button.png
```

---

## 20. 当前一句话总结

这是一个本地网页原型：用“共同养一棵 3D 共生树”的方式，把夫妻 / 伴侣关系中的日常维护、情绪吐槽、回应修复和长期成长做成游戏化体验。当前已经实现静态业务逻辑、React Three Fiber 3D 场景、真实 GLB 树模型选择、连续成长动画、粒子反馈和本地数据保存，但还需要产品伦理、规则设计、架构拆分和后端同步方案上的进一步分析。
