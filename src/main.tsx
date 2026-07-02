import { createRoot, type Root } from "react-dom/client";
import { GameScene } from "./components/game/GameScene";
import type { GameSceneData, GameGrowthAnimation } from "./components/game/types";

const roots = new WeakMap<HTMLElement, Root>();

function parseSceneData(host: HTMLElement): GameSceneData {
  const raw = host.dataset.scene || host.closest<HTMLElement>("[data-scene]")?.dataset.scene || "{}";

  try {
    const data = JSON.parse(raw) as Partial<GameSceneData>;
    return {
      currentUserId: data.currentUserId || "",
      hp: Number(data.hp ?? 100),
      treeShape: data.treeShape || "heritage",
      treeModel: data.treeModel || "common-tree",
      treeModelUrl: data.treeModelUrl || "/assets/models/trees/common-tree.glb",
      growth: Number(data.growth ?? 0),
      growthRatio: Number(data.growthRatio ?? 0.25),
      stage: data.stage || "共生树",
      members: Array.isArray(data.members) ? data.members : [],
      bugs: Array.isArray(data.bugs) ? data.bugs : [],
      fruitCount: Number(data.fruitCount ?? 0),
      matureFruitCount: Number(data.matureFruitCount ?? 0),
      growthAnimation: parseGrowthAnimation(data.growthAnimation),
    };
  } catch (error) {
    console.warn("Game scene data parse failed", error);
    return {
      currentUserId: "",
      hp: 100,
      treeShape: "heritage",
      treeModel: "common-tree",
      treeModelUrl: "/assets/models/trees/common-tree.glb",
      growth: 25,
      growthRatio: 0.25,
      stage: "共生树",
      members: [],
      bugs: [],
      fruitCount: 0,
      matureFruitCount: 0,
      growthAnimation: null,
    };
  }
}

function parseGrowthAnimation(value: unknown): GameGrowthAnimation | null {
  if (!value || typeof value !== "object") return null;
  const animation = value as Partial<GameGrowthAnimation>;
  const fromPercent = Number(animation.fromPercent);
  const toPercent = Number(animation.toPercent);
  if (!Number.isFinite(fromPercent) || !Number.isFinite(toPercent) || toPercent <= fromPercent) return null;

  return {
    id: String(animation.id || `${fromPercent}-${toPercent}`),
    fromPercent,
    toPercent,
    amount: Number(animation.amount ?? Math.max(1, Math.round(toPercent - fromPercent))),
    fromStage: String(animation.fromStage || ""),
    toStage: String(animation.toStage || ""),
    reason: String(animation.reason || "care"),
  };
}

function mountGameScenes() {
  document.querySelectorAll<HTMLElement>(".game-scene-root").forEach((host) => {
    const data = parseSceneData(host);
    const root = roots.get(host) || createRoot(host);
    roots.set(host, root);
    root.render(<GameScene data={data} />);
    host.closest(".tree-scene")?.classList.add("game-scene-ready");
  });
}

window.addEventListener("emotion-tree:render", () => {
  window.requestAnimationFrame(mountGameScenes);
});

window.addEventListener("load", mountGameScenes);
mountGameScenes();
