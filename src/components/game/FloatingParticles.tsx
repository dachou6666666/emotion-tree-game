import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type FloatingParticlesProps = {
  density?: number;
};

export function FloatingParticles({ density = 72 }: FloatingParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.026, 7, 7), []);
  const materials = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ color: "#fff8bd", transparent: true, opacity: 0.72 }),
      new THREE.MeshBasicMaterial({ color: "#bde9ff", transparent: true, opacity: 0.5 }),
      new THREE.MeshBasicMaterial({ color: "#d7ffb8", transparent: true, opacity: 0.55 }),
    ],
    [],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: density }, (_, index) => {
        const radius = 1.6 + Math.random() * 5.9;
        const angle = Math.random() * Math.PI * 2;
        return {
          key: `particle-${index}`,
          position: [
            Math.cos(angle) * radius,
            0.45 + Math.random() * 4.15,
            Math.sin(angle) * radius - 0.75,
          ] as [number, number, number],
          scale: 0.65 + Math.random() * 1.55,
          materialIndex: index % materials.length,
        };
      }),
    [density, materials.length],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    groupRef.current.rotation.y = elapsed * 0.025;
    groupRef.current.position.y = Math.sin(elapsed * 0.55) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle) => (
        <mesh
          key={particle.key}
          geometry={geometry}
          material={materials[particle.materialIndex]}
          position={particle.position}
          scale={particle.scale}
        />
      ))}
    </group>
  );
}
