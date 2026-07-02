# 共生树 Emotion Tree Game

一个本地运行的治愈系关系养成游戏原型。用户共同守护一棵 3D 共生树，用“今日照顾”“心结虫”“共同记忆果子”和“成长轨迹”来表达伴侣 / 家庭关系中的照顾、难受、回应和修复。

## 当前体验

- 中间是 React Three Fiber 渲染的 3D 共生树场景。
- 左侧是今日照顾动作：给树浇水、留一束光、写一句感谢。
- 右侧是等待被看见的心结和今日回应。
- 底部是共同记忆果子和成长轨迹。
- 树会根据成长值连续变大，不是阶段硬切换。
- 心结虫会按成员颜色显示，停留太久时只做温和提醒。
- 数据暂存在浏览器 `localStorage`，key 为 `emotion-tree-game:v1`。

## 技术栈

- Vanilla JavaScript：页面业务逻辑、状态保存、HTML 渲染。
- React + TypeScript：3D 游戏场景入口。
- three / @react-three/fiber / @react-three/drei：WebGL 场景。
- framer-motion：HUD 动效。
- Vite：打包 `src` 里的 3D 场景代码。

## 主要文件

```text
index.html
app.js
styles.css
package.json
package-lock.json
ASSET_LICENSES.md
DEVELOPMENT_HANDOFF.md
src/
public/
assets/
```

`dist/` 是构建输出，本地可生成，不提交到 Git。

## 本地启动

安装依赖：

```powershell
npm install
```

构建 3D 场景：

```powershell
npm run build
```

从工作区根目录启动静态服务器：

```powershell
cd ..
python -m http.server 5174 --bind 0.0.0.0
```

打开：

```text
http://localhost:5174/emotion-tree-game/
```

演示账号：

```text
林夕 / 123456
周晨 / 123456
```

开发测试按钮默认隐藏。如需测试成长动画和树模型选择，在 URL 后加：

```text
?dev=1
```

## 验证命令

```powershell
node --check app.js
npx tsc --noEmit
npm run build
```

## GitHub 推送

仓库已经使用 `main` 分支。首次推送到 GitHub 时添加远程仓库：

```powershell
git remote add origin https://github.com/<your-name>/emotion-tree-game.git
git push -u origin main
```

如果已经配置过远程仓库：

```powershell
git push
```

## 素材授权

树模型来源和授权记录在 `ASSET_LICENSES.md`。提交或发布前请保留该文件。
