import { Component, forwardRef, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GameBug, GameGrowthAnimation } from "./types";
import {
  clampGrowthPercent,
  getGrowthStage,
  getStageBoundaryVisual,
  getTreeGrowthVisual,
  type TreeGrowthStage,
  type TreeGrowthVisual,
} from "./treeGrowth";

type TreeModelProps = {
  shape: string;
  modelUrl: string;
  growthPercent: number;
  growthRatio: number;
  growthAnimation?: GameGrowthAnimation | null;
  hp: number;
  fruitCount: number;
  matureFruitCount: number;
  bugs: GameBug[];
  onInteract?: (origin: [number, number, number]) => void;
};

type Vec3 = [number, number, number];

const DEFAULT_TREE_MODEL_URL = "/assets/models/trees/common-tree.glb";
const TREE_MODEL_URLS = [
  DEFAULT_TREE_MODEL_URL,
  "/assets/models/trees/pine-wide.glb",
  "/assets/models/trees/pine-tall.glb",
  "/assets/models/trees/pine-compact.glb",
  "/assets/models/trees/twisted-emerald.glb",
  "/assets/models/trees/twisted-round.glb",
  "/assets/models/trees/twisted-amber.glb",
];

type TreeModelBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type TreeModelBoundaryState = {
  hasError: boolean;
};

class TreeModelErrorBoundary extends Component<TreeModelBoundaryProps, TreeModelBoundaryState> {
  state: TreeModelBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[EmotionTree] tree.glb failed, using fallback low-poly tree.", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function TreeModel(props: TreeModelProps) {
  const modelUrl = props.modelUrl || DEFAULT_TREE_MODEL_URL;
  return (
    <TreeModelErrorBoundary key={modelUrl} fallback={<LowPolyTreeFallback {...props} />}>
      <LoadedTreeModel {...props} modelUrl={modelUrl} />
    </TreeModelErrorBoundary>
  );
}

function LoadedTreeModel({ modelUrl, growthPercent, growthAnimation, hp, fruitCount, matureFruitCount, bugs, onInteract }: TreeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const canopyRef = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);
  const activeModelUrl = modelUrl || DEFAULT_TREE_MODEL_URL;
  const gltf = useGLTF(activeModelUrl) as { scene: THREE.Group };
  const targetGrowth = clampGrowthPercent(growthPercent);
  const initialGrowth = clampGrowthPercent(growthAnimation?.fromPercent ?? targetGrowth);
  const initialStage = getGrowthStage(initialGrowth);
  const targetStage = getGrowthStage(targetGrowth);
  const animatedGrowth = useRef(initialGrowth);
  const animatedVisualRef = useRef(getTreeGrowthVisual(initialGrowth));
  const targetGrowthRef = useRef(targetGrowth);
  const lastVisualCommit = useRef(0);
  const [animatedVisual, setAnimatedVisual] = useState<TreeGrowthVisual>(() => getTreeGrowthVisual(initialGrowth));
  const [stageBlend, setStageBlend] = useState(() => ({
    previousStage: initialStage !== targetStage ? initialStage : null,
    currentStage: targetStage,
    progress: initialStage !== targetStage ? 0 : 1,
  }));
  const stageBlendRef = useRef(stageBlend);
  const healthScale = hp <= 35 ? 0.88 : hp <= 68 ? 0.94 : 1;
  const targetScale = getTreeGrowthVisual(targetGrowth).targetScale;
  const animatedScale = animatedVisual.targetScale;
  const stageProgress = animatedVisual.stageProgress;
  const previousStage = stageBlend.previousStage;
  const currentStage = stageBlend.currentStage;

  useEffect(() => {
    targetGrowthRef.current = targetGrowth;
    const nextStage = getGrowthStage(targetGrowth);
    setStageBlend((current) => {
      if (current.currentStage === nextStage && current.progress >= 1) return current;
      const next = {
        previousStage: current.currentStage === nextStage ? current.previousStage : current.currentStage,
        currentStage: nextStage,
        progress: current.currentStage === nextStage ? current.progress : 0,
      };
      stageBlendRef.current = next;
      return next;
    });
  }, [targetGrowth]);

  useEffect(() => {
    console.info("[EmotionTree] loaded tree model", activeModelUrl);
  }, [activeModelUrl]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    const damping = growthAnimation ? 2.45 : 4.2;
    animatedGrowth.current = THREE.MathUtils.damp(animatedGrowth.current, targetGrowthRef.current, damping, delta);
    if (Math.abs(animatedGrowth.current - targetGrowthRef.current) < 0.035) {
      animatedGrowth.current = targetGrowthRef.current;
    }
    const visual = getTreeGrowthVisual(animatedGrowth.current);
    animatedVisualRef.current = visual;

    const worldScale = visual.targetScale * healthScale;
    groupRef.current.scale.setScalar(worldScale);
    groupRef.current.position.y = 0.08 + visual.stageProgress * 0.08;

    shakeRef.current = Math.max(0, shakeRef.current - delta * 1.85);
    const shake = Math.sin(shakeRef.current * Math.PI * 7) * shakeRef.current * 0.12;
    groupRef.current.rotation.z = Math.sin(elapsed * 0.68) * 0.009 + shake;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.48 + 1.5) * 0.006;

    if (canopyRef.current) {
      canopyRef.current.scale.setScalar(visual.crownScale);
      canopyRef.current.rotation.y = Math.sin(elapsed * 0.72) * 0.035;
      canopyRef.current.position.y = visual.crownY + Math.sin(elapsed * 1.1) * 0.025;
    }

    const currentBlend = stageBlendRef.current;
    if (currentBlend.progress < 1) {
      const next = {
        previousStage: currentBlend.previousStage,
        currentStage: currentBlend.currentStage,
        progress: Math.min(1, currentBlend.progress + delta / 1.5),
      };
      stageBlendRef.current = next;
      if (elapsed - lastVisualCommit.current > 0.03 || next.progress >= 1) {
        setStageBlend(next.progress >= 1 ? { ...next, previousStage: null } : next);
      }
    }

    if (elapsed - lastVisualCommit.current > 0.033 || visual.growthPercent === targetGrowthRef.current) {
      lastVisualCommit.current = elapsed;
      setAnimatedVisual(visual);
    }
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    shakeRef.current = 1;
    const visual = animatedVisualRef.current;
    const worldScale = visual.targetScale * healthScale;
    onInteract?.([0, 0.08 + visual.crownY * worldScale + 0.18, 0]);
  }

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {previousStage && stageBlend.progress < 1 ? (
        <StageTreeLayer
          key={`previous-${previousStage}`}
          scene={gltf.scene}
          stage={previousStage}
          visual={getStageBoundaryVisual(previousStage, "end")}
          opacity={1 - stageBlend.progress}
        />
      ) : null}
      <StageTreeLayer
        key={`current-${currentStage}`}
        scene={gltf.scene}
        stage={currentStage}
        visual={animatedVisual}
        opacity={previousStage ? Math.max(0.2, stageBlend.progress) : 1}
      />
      <GrowthCanopy ref={canopyRef} visual={animatedVisual} stageProgress={stageProgress} targetScale={targetScale} animatedScale={animatedScale} />
      <TreeOrnaments crownY={animatedVisual.crownY} fruitCount={fruitCount} matureFruitCount={matureFruitCount} bugs={bugs} />
    </group>
  );
}

function StageTreeLayer({
  scene,
  stage,
  visual,
  opacity,
}: {
  scene: THREE.Group;
  stage: TreeGrowthStage;
  visual: TreeGrowthVisual;
  opacity: number;
}) {
  const model = useMemo(() => cloneTreeScene(scene, opacity), [scene]);

  useEffect(() => {
    setTreeModelOpacity(model, opacity);
  }, [model, opacity]);

  return (
    <group
      scale={[
        0.94 + visual.crownScale * 0.06,
        visual.trunkScale,
        0.94 + visual.crownScale * 0.06,
      ]}
      userData={{ growthStage: stage }}
    >
      <primitive object={model} />
    </group>
  );
}

type GrowthCanopyProps = {
  visual: TreeGrowthVisual;
  stageProgress: number;
  targetScale: number;
  animatedScale: number;
};

const GrowthCanopy = forwardRef<THREE.Group, GrowthCanopyProps>(function GrowthCanopy(
  { visual, stageProgress, targetScale, animatedScale },
  ref,
) {
  const opacity = Math.max(0, Math.min(0.22, 0.07 + stageProgress * 0.16 + Math.max(0, targetScale - animatedScale) * 0.75));

  return (
    <group ref={ref} position={[0, visual.crownY, 0]} scale={visual.crownScale}>
      <mesh castShadow position={[-0.34, 0.18, 0.08]} rotation={[0.18, 0.45, 0.08]} scale={[1.1, 0.82, 0.9]}>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#7fb85f" transparent opacity={opacity} roughness={0.72} depthWrite={false} />
      </mesh>
      <mesh castShadow position={[0.42, 0.08, -0.08]} rotation={[0.08, -0.35, 0.12]} scale={[0.98, 0.78, 0.92]}>
        <dodecahedronGeometry args={[0.68, 0]} />
        <meshStandardMaterial color="#9cc86a" transparent opacity={opacity * 0.9} roughness={0.72} depthWrite={false} />
      </mesh>
      <mesh castShadow position={[0.04, 0.46, 0.02]} rotation={[0.05, 0.12, -0.08]} scale={[0.85, 0.68, 0.8]}>
        <dodecahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color="#a8d471" transparent opacity={opacity * 0.82} roughness={0.72} depthWrite={false} />
      </mesh>
    </group>
  );
});

function cloneTreeScene(scene: THREE.Group, opacity: number) {
  const cloned = scene.clone(true);
  cloned.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const clonedMaterials = materials.map((material) => {
      const clonedMaterial = material.clone();
      clonedMaterial.side = THREE.DoubleSide;
      clonedMaterial.transparent = opacity < 1 || material.transparent;
      clonedMaterial.opacity = opacity;
      clonedMaterial.depthWrite = opacity >= 0.98;
      clonedMaterial.needsUpdate = true;
      return clonedMaterial;
    });

    object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
  });
  return cloned;
}

function setTreeModelOpacity(model: THREE.Group, opacity: number) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1 || material.transparent;
      material.opacity = opacity;
      material.depthWrite = opacity >= 0.98;
      material.needsUpdate = true;
    });
  });
}

function LowPolyTreeFallback({ shape, growthRatio, hp, fruitCount, matureFruitCount, bugs, onInteract }: TreeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);
  const ratio = Math.min(Math.max(growthRatio || 0, 0.08), 1);
  const config = getShapeConfig(shape);
  const healthTint = hp <= 35 ? "#5f7b51" : hp <= 68 ? "#6c9455" : config.leaf;
  const trunkHeight = 1.9 + ratio * 1.15 + config.heightOffset;
  const trunkRadius = 0.24 + ratio * 0.1;
  const crownY = trunkHeight + 0.55;
  const leafScale = 0.68 + ratio * 0.76;
  const branchSpread = 0.88 + ratio * 0.76 + config.spreadOffset;

  const branches = useMemo(
    () =>
      [
        { start: [0, 1.25, 0] as Vec3, end: [-branchSpread, crownY - 0.55, -0.1] as Vec3, radius: 0.13 },
        { start: [0, 1.38, 0] as Vec3, end: [branchSpread * 0.95, crownY - 0.38, 0.02] as Vec3, radius: 0.12 },
        { start: [0.02, 1.58, 0] as Vec3, end: [-branchSpread * 0.55, crownY - 0.1, 0.38] as Vec3, radius: 0.1 },
        { start: [0.01, 1.72, 0] as Vec3, end: [branchSpread * 0.55, crownY + 0.1, -0.44] as Vec3, radius: 0.09 },
        { start: [0, 1.92, 0] as Vec3, end: [0.12, crownY + 0.42, 0.02] as Vec3, radius: 0.08 },
      ],
    [branchSpread, crownY],
  );

  const leaves = useMemo(
    () =>
      [
        { position: [0, crownY + 0.52, 0] as Vec3, scale: [1.18, 0.96, 1.08] as Vec3, color: healthTint },
        { position: [-0.85, crownY + 0.02, -0.1] as Vec3, scale: [0.9, 0.68, 0.78] as Vec3, color: config.leafDark },
        { position: [0.86, crownY + 0.14, 0.12] as Vec3, scale: [0.82, 0.66, 0.76] as Vec3, color: config.leafLight },
        { position: [-0.42, crownY + 0.6, 0.42] as Vec3, scale: [0.72, 0.58, 0.66] as Vec3, color: config.leafLight },
        { position: [0.52, crownY + 0.62, -0.46] as Vec3, scale: [0.7, 0.56, 0.68] as Vec3, color: config.leafDark },
        { position: [0.08, crownY - 0.18, 0.42] as Vec3, scale: [0.86, 0.54, 0.72] as Vec3, color: healthTint },
        { position: [-0.12, crownY + 1.0, -0.08] as Vec3, scale: [0.58, 0.5, 0.54] as Vec3, color: config.leafLight },
      ],
    [config.leafDark, config.leafLight, crownY, healthTint],
  );

  const fruits = useMemo(
    () =>
      Array.from({ length: Math.min(fruitCount, 9) }, (_, index) => {
        const angle = index * 1.38;
        const radius = 0.62 + (index % 3) * 0.28;
        return {
          key: `fruit-${index}`,
          position: [
            Math.cos(angle) * radius,
            crownY + 0.35 + Math.sin(index * 2.1) * 0.5,
            Math.sin(angle) * radius,
          ] as Vec3,
          ripe: index < matureFruitCount,
        };
      }),
    [crownY, fruitCount, matureFruitCount],
  );

  const visibleBugs = useMemo(
    () =>
      bugs.slice(0, 12).map((bug, index) => {
        const angle = index * 1.7 + 0.4;
        const radius = 0.78 + (index % 2) * 0.36;
        return {
          bug,
          position: [
            Math.cos(angle) * radius,
            crownY + 0.12 + Math.sin(index * 1.9) * 0.55,
            Math.sin(angle) * radius,
          ] as Vec3,
        };
      }),
    [bugs, crownY],
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    shakeRef.current = Math.max(0, shakeRef.current - delta * 1.85);
    const shake = Math.sin(shakeRef.current * Math.PI * 7) * shakeRef.current * 0.13;
    groupRef.current.rotation.z = Math.sin(elapsed * 0.78) * 0.012 + shake;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.54 + 1.5) * 0.008;
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    shakeRef.current = 1;
    onInteract?.([0, crownY + 0.35, 0]);
  }

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown} scale={0.9 + ratio * 0.12}>
      <mesh castShadow receiveShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius * 0.74, trunkRadius, trunkHeight, 11]} />
        <meshStandardMaterial color="#7a4b2b" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0.04, trunkHeight * 0.47, 0.04]} scale={[0.55, 1, 0.55]}>
        <cylinderGeometry args={[trunkRadius * 0.58, trunkRadius * 0.36, trunkHeight * 0.98, 7]} />
        <meshStandardMaterial color="#5c341f" roughness={0.88} transparent opacity={0.74} />
      </mesh>

      <Root start={[0, 0.18, 0]} end={[-0.78, 0.06, 0.48]} radius={0.12} />
      <Root start={[0, 0.16, 0]} end={[0.86, 0.05, 0.42]} radius={0.11} />
      <Root start={[0, 0.14, 0]} end={[-0.55, 0.04, -0.56]} radius={0.1} />
      <Root start={[0, 0.14, 0]} end={[0.62, 0.04, -0.62]} radius={0.1} />

      {branches.map((branch, index) => (
        <Branch
          key={`branch-${index}`}
          start={branch.start}
          end={branch.end}
          radius={branch.radius * (0.8 + ratio * 0.24)}
          color={index % 2 === 0 ? "#6b4126" : "#5d351f"}
        />
      ))}

      {leaves.map((leaf, index) => (
        <mesh
          key={`leaf-${index}`}
          castShadow
          receiveShadow
          position={leaf.position}
          scale={[leaf.scale[0] * leafScale, leaf.scale[1] * leafScale, leaf.scale[2] * leafScale]}
          rotation={[index * 0.21, index * 0.47, index * 0.14]}
        >
          <dodecahedronGeometry args={[0.78, 0]} />
          <meshStandardMaterial color={leaf.color} roughness={0.68} />
        </mesh>
      ))}

      {fruits.map((fruit) => (
        <mesh key={fruit.key} castShadow position={fruit.position}>
          <sphereGeometry args={[fruit.ripe ? 0.105 : 0.082, 14, 10]} />
          <meshStandardMaterial
            color={fruit.ripe ? "#f5a32d" : "#c9d674"}
            emissive={fruit.ripe ? "#3f2100" : "#1a2205"}
            emissiveIntensity={fruit.ripe ? 0.18 : 0.05}
            roughness={0.45}
          />
        </mesh>
      ))}

      {visibleBugs.map(({ bug, position }, index) => (
        <group key={bug.id || `bug-${index}`} position={position} rotation={[0.2, index * 0.8, 0.12]}>
          <mesh castShadow scale={[1.2, 0.7, 0.85]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial
              color={bug.color || "#bd6a58"}
              emissive={bug.urgent ? "#5e1308" : "#111111"}
              emissiveIntensity={bug.urgent ? 0.35 : 0.08}
              roughness={0.42}
            />
          </mesh>
          <mesh position={[0, 0.048, 0.064]} scale={[0.85, 0.28, 0.52]}>
            <sphereGeometry args={[0.046, 8, 6]} />
            <meshBasicMaterial color={bug.damaged ? "#2c1d18" : "#fff3cd"} transparent opacity={0.78} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TreeOrnaments({
  crownY,
  fruitCount,
  matureFruitCount,
  bugs,
}: {
  crownY: number;
  fruitCount: number;
  matureFruitCount: number;
  bugs: GameBug[];
}) {
  const fruits = useMemo(
    () =>
      Array.from({ length: Math.min(fruitCount, 9) }, (_, index) => {
        const angle = index * 1.38;
        const radius = 0.78 + (index % 3) * 0.34;
        return {
          key: `model-fruit-${index}`,
          position: [
            Math.cos(angle) * radius,
            crownY + 0.2 + Math.sin(index * 2.1) * 0.58,
            Math.sin(angle) * radius,
          ] as Vec3,
          ripe: index < matureFruitCount,
        };
      }),
    [crownY, fruitCount, matureFruitCount],
  );

  const visibleBugs = useMemo(
    () =>
      bugs.slice(0, 12).map((bug, index) => {
        const angle = index * 1.7 + 0.4;
        const radius = 0.9 + (index % 2) * 0.42;
        return {
          bug,
          position: [
            Math.cos(angle) * radius,
            crownY + 0.04 + Math.sin(index * 1.9) * 0.62,
            Math.sin(angle) * radius,
          ] as Vec3,
        };
      }),
    [bugs, crownY],
  );

  return (
    <>
      {fruits.map((fruit) => (
        <mesh key={fruit.key} castShadow position={fruit.position}>
          <sphereGeometry args={[fruit.ripe ? 0.15 : 0.12, 14, 10]} />
          <meshStandardMaterial
            color={fruit.ripe ? "#f5a32d" : "#c9d674"}
            emissive={fruit.ripe ? "#3f2100" : "#1a2205"}
            emissiveIntensity={fruit.ripe ? 0.18 : 0.05}
            roughness={0.45}
          />
        </mesh>
      ))}

      {visibleBugs.map(({ bug, position }, index) => (
        <group key={bug.id || `model-bug-${index}`} position={position} rotation={[0.2, index * 0.8, 0.12]}>
          <mesh castShadow scale={[1.2, 0.7, 0.85]}>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial
              color={bug.color || "#bd6a58"}
              emissive={bug.urgent ? "#5e1308" : "#111111"}
              emissiveIntensity={bug.urgent ? 0.35 : 0.08}
              roughness={0.42}
            />
          </mesh>
          <mesh position={[0, 0.07, 0.09]} scale={[0.85, 0.28, 0.52]}>
            <sphereGeometry args={[0.066, 8, 6]} />
            <meshBasicMaterial color={bug.damaged ? "#2c1d18" : "#fff3cd"} transparent opacity={0.78} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function getShapeConfig(shape: string) {
  if (shape === "willow") {
    return {
      leaf: "#609852",
      leafDark: "#3f7b45",
      leafLight: "#84b665",
      spreadOffset: 0.24,
      heightOffset: 0.06,
    };
  }

  if (shape === "bloom") {
    return {
      leaf: "#76a85a",
      leafDark: "#4d7d47",
      leafLight: "#9cc766",
      spreadOffset: 0.06,
      heightOffset: -0.02,
    };
  }

  if (shape === "sentinel") {
    return {
      leaf: "#4f8755",
      leafDark: "#34623f",
      leafLight: "#73aa60",
      spreadOffset: -0.12,
      heightOffset: 0.24,
    };
  }

  return {
    leaf: "#5f9853",
    leafDark: "#3f7544",
    leafLight: "#88b963",
    spreadOffset: 0.12,
    heightOffset: 0,
  };
}

function Root({ start, end, radius }: { start: Vec3; end: Vec3; radius: number }) {
  return <Branch start={start} end={end} radius={radius} color="#5b331e" />;
}

function Branch({ start, end, radius, color }: { start: Vec3; end: Vec3; radius: number; color: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const startVector = new THREE.Vector3(...start);
    const endVector = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endVector, startVector);
    return {
      position: new THREE.Vector3().addVectors(startVector, endVector).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [end, start]);

  return (
    <mesh castShadow receiveShadow position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius * 0.48, radius, length, 9]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

TREE_MODEL_URLS.forEach((url) => useGLTF.preload(url));
