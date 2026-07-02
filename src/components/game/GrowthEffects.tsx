import { useMemo, useRef } from "react";
import { Html, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type GrowthBurst = {
  id: number;
  createdAt: number;
  origin: [number, number, number];
  label: string;
  mode?: "tap" | "care";
};

type GrowthEffectsProps = {
  bursts: GrowthBurst[];
};

export function GrowthEffects({ bursts }: GrowthEffectsProps) {
  return (
    <>
      {bursts.map((burst) => (
        <GrowthBurstView key={burst.id} burst={burst} />
      ))}
    </>
  );
}

function GrowthBurstView({ burst }: { burst: GrowthBurst }) {
  const groupRef = useRef<THREE.Group>(null);
  const groundRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const groundRingRef = useRef<THREE.Mesh>(null);
  const mountedAt = useRef(performance.now());
  const isCare = burst.mode === "care";
  const dots = useMemo(
    () =>
      Array.from({ length: isCare ? 34 : 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = 0.22 + (index % 3) * (isCare ? 0.09 : 0.06);
        return {
          key: `burst-dot-${burst.id}-${index}`,
          position: [Math.cos(angle) * radius, Math.sin(index * 1.7) * 0.08, Math.sin(angle) * radius] as [
            number,
            number,
            number,
          ],
        };
      }),
    [burst.id, isCare],
  );
  const groundParticles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.35 + Math.random() * 1.2;
        return {
          key: `ground-growth-${burst.id}-${index}`,
          position: [Math.cos(angle) * radius, 0.08 + Math.random() * 0.14, Math.sin(angle) * radius] as [
            number,
            number,
            number,
          ],
          speed: 0.7 + Math.random() * 0.8,
          scale: 0.65 + Math.random() * 0.9,
        };
      }),
    [burst.id],
  );

  useFrame(() => {
    const age = Math.min((performance.now() - mountedAt.current) / 1000, isCare ? 2.2 : 1.4);
    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + age * 1.65);
      groupRef.current.position.y = burst.origin[1] + age * 0.62;
      groupRef.current.rotation.y += 0.035;
    }
    if (ringRef.current) {
      ringRef.current.scale.set(1 + age * 2.4, 1 + age * 2.4, 1 + age * 2.4);
    }
    if (groundRef.current) {
      groundRef.current.children.forEach((child, index) => {
        child.position.y = 0.08 + age * groundParticles[index].speed;
      });
    }
    if (groundRingRef.current) {
      const ringScale = 1 + age * 2.2;
      groundRingRef.current.scale.set(ringScale, ringScale, ringScale);
      const material = groundRingRef.current.material;
      if (material instanceof THREE.Material) {
        material.opacity = Math.max(0, 0.58 - age * 0.28);
      }
    }
  });

  return (
    <>
      {isCare && (
        <group>
          <pointLight color="#b8ff83" intensity={2.4} distance={5.2} decay={2} position={[0, 1.1, 0]} />
          <mesh ref={groundRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
            <torusGeometry args={[0.95, 0.035, 10, 72]} />
            <meshBasicMaterial color="#b8ff83" transparent opacity={0.58} />
          </mesh>
          <group ref={groundRef}>
            {groundParticles.map((particle) => (
              <mesh key={particle.key} position={particle.position} scale={particle.scale}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color="#c8ff8e" transparent opacity={0.78} />
              </mesh>
            ))}
          </group>
        </group>
      )}
      <group ref={groupRef} position={burst.origin}>
        <pointLight color={isCare ? "#c6ff85" : "#fff1a2"} intensity={isCare ? 3.4 : 2.8} distance={3.4} decay={2} />
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[isCare ? 0.58 : 0.45, 0.018, 8, 40]} />
          <meshBasicMaterial color={isCare ? "#c5ff80" : "#ffe889"} transparent opacity={0.66} />
        </mesh>
        {dots.map((dot) => (
          <mesh key={dot.key} position={dot.position}>
            <sphereGeometry args={[isCare ? 0.055 : 0.045, 8, 8]} />
            <meshBasicMaterial color={isCare ? "#d4ff9a" : "#fff3a4"} transparent opacity={0.86} />
          </mesh>
        ))}
        <Sparkles
          count={isCare ? 46 : 28}
          scale={isCare ? [2.2, 1.7, 2.2] : [1.6, 1.2, 1.6]}
          size={isCare ? 6 : 5}
          speed={isCare ? 2.3 : 1.9}
          color={isCare ? "#cfff8c" : "#fff2a8"}
          opacity={0.9}
        />
        <Html position={[0, 0.72, 0]} center distanceFactor={7} zIndexRange={[100, 0]}>
          <div className={`growth-float-label ${isCare ? "care" : ""}`}>{burst.label}</div>
        </Html>
      </group>
    </>
  );
}
