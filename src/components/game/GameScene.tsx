import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { CharacterModel } from "./CharacterModel";
import { FloatingParticles } from "./FloatingParticles";
import { GrowthEffects, type GrowthBurst } from "./GrowthEffects";
import { TreeModel } from "./TreeModel";
import type { GameGrowthAnimation, GameSceneData } from "./types";
import { easeOutCubic } from "./treeGrowth";

type GameSceneProps = {
  data: GameSceneData;
};

const characterPositions: [number, number, number][] = [
  [-1.22, 0, 2.16],
  [1.22, 0, 2.08],
  [-1.92, 0, 0.55],
  [1.92, 0, 0.45],
];

export function GameScene({ data }: GameSceneProps) {
  const [bursts, setBursts] = useState<GrowthBurst[]>([]);
  const handledGrowthAnimationId = useRef<string | null>(null);
  const members = data.members.length ? data.members.slice(0, 4) : fallbackMembers();
  const displayGrowth = useAnimatedGrowthNumber(data.growth, data.growthAnimation);
  const safeGrowth = Math.min(Math.max(displayGrowth / 100, 0), 1);

  function triggerGrowthBurst(origin: [number, number, number], label: string, mode: GrowthBurst["mode"] = "tap") {
    const id = Date.now();
    setBursts((current) => [
      ...current.slice(-3),
      {
        id,
        createdAt: performance.now(),
        origin,
        label,
        mode,
      },
    ]);
    window.setTimeout(() => {
      setBursts((current) => current.filter((burst) => burst.id !== id));
    }, mode === "care" ? 3200 : 1800);
  }

  function handleTreeInteract(origin: [number, number, number]) {
    triggerGrowthBurst(origin, "+1 成长", "tap");
  }

  useEffect(() => {
    const animation = data.growthAnimation;
    if (!animation || handledGrowthAnimationId.current === animation.id) return;
    handledGrowthAnimationId.current = animation.id;
    triggerGrowthBurst([0, 0.85, 0], `+${animation.amount} 成长`, "care");
  }, [data.growthAnimation]);

  return (
    <div className="r3f-game-stage">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 4.55, 8.9], fov: 43, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={["#b9e7ff"]} />
        <fog attach="fog" args={["#d8f2df", 9, 24]} />
        <Sky sunPosition={[4, 6, 2]} turbidity={5.2} rayleigh={1.8} mieCoefficient={0.012} mieDirectionalG={0.76} />
        <ambientLight intensity={0.52} />
        <hemisphereLight intensity={0.82} color="#f3ffe0" groundColor="#4c7652" />
        <directionalLight
          castShadow
          position={[4.2, 7.5, 4.6]}
          intensity={2.4}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={0.5}
          shadow-camera-far={24}
        />
        <Suspense fallback={null}>
          <GameWorld data={data} members={members} growthRatio={safeGrowth} onTreeInteract={handleTreeInteract} />
          <GrowthEffects bursts={bursts} />
        </Suspense>
        <ContactShadows position={[0, 0.021, 0]} opacity={0.32} scale={8.5} blur={2.8} far={6} />
        <OrbitControls
          target={[0, 1.7, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.47}
          rotateSpeed={0.42}
        />
      </Canvas>

      <motion.div
        className="game-scene-ui"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="scene-hud-pill">
          <span>阶段</span>
          <strong>{data.stage || "共生树"}</strong>
        </div>
        <div className="scene-hud-pill growth">
          <span>成长</span>
          <strong>{Math.round(displayGrowth)}%</strong>
          <div className="scene-hud-meter" aria-hidden="true">
            <i style={{ width: `${Math.min(Math.max(displayGrowth, 0), 100)}%` }} />
          </div>
        </div>
        <div className="scene-hud-pill">
          <span>状态</span>
          <strong>{data.hp >= 70 ? "明亮" : data.hp >= 40 ? "需要陪伴" : "低落"}</strong>
        </div>
      </motion.div>
      <div className="game-scene-member-bar">
        {members.map((member) => (
          <span key={member.id} className={member.active ? "active" : ""}>
            <i style={{ background: member.color }} />
            {member.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function GameWorld({
  data,
  members,
  growthRatio,
  onTreeInteract,
}: {
  data: GameSceneData;
  members: GameSceneData["members"];
  growthRatio: number;
  onTreeInteract: (origin: [number, number, number]) => void;
}) {
  const grassTufts = useGrassTufts(64);

  return (
    <group>
      <Ground growthRatio={growthRatio} grassTufts={grassTufts} />
      <TreeModel
        shape={data.treeShape}
        modelUrl={data.treeModelUrl}
        growthPercent={data.growth}
        growthRatio={data.growthRatio}
        growthAnimation={data.growthAnimation}
        hp={data.hp}
        fruitCount={data.fruitCount}
        matureFruitCount={data.matureFruitCount}
        bugs={data.bugs}
        onInteract={onTreeInteract}
      />
      {members.map((member, index) => (
        <CharacterModel
          key={member.id}
          member={member}
          index={index}
          position={characterPositions[index] || characterPositions[0]}
        />
      ))}
      <FloatingParticles density={90} />
      <Sparkles count={45} scale={[7, 3.2, 6.5]} position={[0, 2, 0]} speed={0.34} size={2.1} color="#fff3ad" opacity={0.46} />
    </group>
  );
}

function useAnimatedGrowthNumber(targetGrowth: number, growthAnimation?: GameGrowthAnimation | null) {
  const [value, setValue] = useState(() => growthAnimation?.fromPercent ?? targetGrowth);
  const currentValue = useRef(value);

  useEffect(() => {
    const from = growthAnimation?.fromPercent ?? currentValue.current;
    const to = targetGrowth;
    const duration = growthAnimation ? 2300 : 900;
    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const nextValue = from + (to - from) * easeOutCubic(progress);
      currentValue.current = nextValue;
      setValue(nextValue);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [growthAnimation?.id, targetGrowth]);

  return value;
}

type GrassTuft = {
  key: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
};

function useGrassTufts(count: number) {
  return useMemo<GrassTuft[]>(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.8 + Math.random() * 6.2;
        const colors = ["#74a756", "#8abd5e", "#5f934f", "#a4c86b"];
        return {
          key: `grass-${index}`,
          position: [Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius - 0.55],
          rotation: [Math.random() * 0.26, Math.random() * Math.PI, Math.random() * 0.18],
          scale: [0.42 + Math.random() * 0.34, 0.52 + Math.random() * 0.52, 0.42 + Math.random() * 0.24],
          color: colors[index % colors.length],
        };
      }),
    [count],
  );
}

function Ground({ growthRatio, grassTufts }: { growthRatio: number; grassTufts: GrassTuft[] }) {
  const groundColor = growthRatio > 0.62 ? "#74ad61" : "#6b9d58";

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, -0.2]}>
        <circleGeometry args={[7.4, 72]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh receiveShadow position={[0, -0.13, -0.2]}>
        <cylinderGeometry args={[7.4, 7.4, 0.22, 72]} />
        <meshStandardMaterial color="#4d7649" roughness={0.96} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -0.2]}>
        <ringGeometry args={[2.35, 7.38, 72]} />
        <meshBasicMaterial color="#d5f19b" transparent opacity={0.08} />
      </mesh>
      {grassTufts.map((tuft) => (
        <mesh key={tuft.key} castShadow position={tuft.position} rotation={tuft.rotation} scale={tuft.scale}>
          <coneGeometry args={[0.035, 0.36, 4]} />
          <meshStandardMaterial color={tuft.color} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function fallbackMembers() {
  return [
    { id: "a", name: "成员 A", color: "#58a56e", avatar: "listener", avatarName: "倾听者", active: true },
    { id: "b", name: "成员 B", color: "#5d9fbe", avatar: "guardian", avatarName: "守护者", active: false },
  ];
}
