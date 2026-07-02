export type TreeGrowthStage = "seedling" | "sapling" | "young" | "mature";

export type TreeGrowthVisual = {
  growthPercent: number;
  currentStage: TreeGrowthStage;
  stageProgress: number;
  easedStageProgress: number;
  targetScale: number;
  trunkScale: number;
  crownScale: number;
  leafUnfold: number;
  crownY: number;
};

type StageConfig = {
  id: TreeGrowthStage;
  min: number;
  max: number;
  scale: [number, number];
  trunkScale: [number, number];
  crownScale: [number, number];
  crownY: [number, number];
  leafUnfold: [number, number];
};

const STAGES: StageConfig[] = [
  {
    id: "seedling",
    min: 0,
    max: 20,
    scale: [0.18, 0.32],
    trunkScale: [0.52, 0.68],
    crownScale: [0.3, 0.48],
    crownY: [2.5, 3.05],
    leafUnfold: [0.28, 0.48],
  },
  {
    id: "sapling",
    min: 20,
    max: 50,
    scale: [0.32, 0.52],
    trunkScale: [0.68, 0.86],
    crownScale: [0.48, 0.7],
    crownY: [3.05, 3.9],
    leafUnfold: [0.48, 0.72],
  },
  {
    id: "young",
    min: 50,
    max: 80,
    scale: [0.52, 0.68],
    trunkScale: [0.86, 0.98],
    crownScale: [0.7, 0.9],
    crownY: [3.9, 4.55],
    leafUnfold: [0.72, 0.9],
  },
  {
    id: "mature",
    min: 80,
    max: 100,
    scale: [0.68, 0.78],
    trunkScale: [0.98, 1.06],
    crownScale: [0.9, 1.08],
    crownY: [4.55, 4.95],
    leafUnfold: [0.9, 1],
  },
];

export function clampGrowthPercent(growthPercent: number) {
  if (!Number.isFinite(growthPercent)) return 0;
  return Math.min(Math.max(growthPercent, 0), 100);
}

export function easeOutCubic(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export function getGrowthStage(growthPercent: number): TreeGrowthStage {
  const percent = clampGrowthPercent(growthPercent);
  if (percent <= 20) return "seedling";
  if (percent <= 50) return "sapling";
  if (percent <= 80) return "young";
  return "mature";
}

export function getStageProgress(growthPercent: number) {
  const percent = clampGrowthPercent(growthPercent);
  const stage = getStageConfig(percent);
  return stage.max === stage.min ? 1 : Math.min(Math.max((percent - stage.min) / (stage.max - stage.min), 0), 1);
}

export function getTreeGrowthVisual(growthPercent: number): TreeGrowthVisual {
  const percent = clampGrowthPercent(growthPercent);
  const stage = getStageConfig(percent);
  const stageProgress = getStageProgress(percent);
  const easedStageProgress = easeOutCubic(stageProgress);

  return {
    growthPercent: percent,
    currentStage: stage.id,
    stageProgress,
    easedStageProgress,
    targetScale: mix(stage.scale[0], stage.scale[1], stageProgress),
    trunkScale: mix(stage.trunkScale[0], stage.trunkScale[1], stageProgress),
    crownScale: mix(stage.crownScale[0], stage.crownScale[1], stageProgress),
    leafUnfold: mix(stage.leafUnfold[0], stage.leafUnfold[1], easedStageProgress),
    crownY: mix(stage.crownY[0], stage.crownY[1], stageProgress),
  };
}

export function getStageBoundaryVisual(stageId: TreeGrowthStage, boundary: "start" | "end") {
  const stage = STAGES.find((item) => item.id === stageId) || STAGES[0];
  return getTreeGrowthVisual(boundary === "start" ? stage.min : stage.max);
}

function getStageConfig(growthPercent: number) {
  const stageId = getGrowthStage(growthPercent);
  return STAGES.find((stage) => stage.id === stageId) || STAGES[0];
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}
