export type GameMember = {
  id: string;
  name: string;
  color: string;
  avatar: "listener" | "guardian" | "healer" | "keeper" | string;
  avatarName: string;
  active: boolean;
};

export type GameBug = {
  id: string;
  authorId: string;
  authorName: string;
  color: string;
  urgent: boolean;
  damaged: boolean;
};

export type GameSceneData = {
  currentUserId: string;
  hp: number;
  treeShape: "heritage" | "willow" | "bloom" | "sentinel" | string;
  treeModel: string;
  treeModelUrl: string;
  growth: number;
  growthRatio: number;
  stage: string;
  members: GameMember[];
  bugs: GameBug[];
  fruitCount: number;
  matureFruitCount: number;
  growthAnimation?: GameGrowthAnimation | null;
};

export type GameGrowthAnimation = {
  id: string;
  fromPercent: number;
  toPercent: number;
  amount: number;
  fromStage: string;
  toStage: string;
  reason: "care" | "bonus" | "harvest" | "bug" | string;
};
