import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GameMember } from "./types";

type CharacterModelProps = {
  member: GameMember;
  index: number;
  position: [number, number, number];
};

const skin = "#f0bd91";
const eye = "#19251f";

export function CharacterModel({ member, index, position }: CharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const color = member.color || "#5ba36d";
  const accent = useMemo(() => new THREE.Color(color).offsetHSL(0.04, 0.05, 0.18).getStyle(), [color]);
  const darker = useMemo(() => new THREE.Color(color).offsetHSL(0, -0.08, -0.18).getStyle(), [color]);
  const hairColor = index % 2 === 0 ? "#3d2b20" : "#233044";
  const avatar = member.avatar || "listener";

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(elapsed * 1.7 + index) * 0.035;
    groupRef.current.rotation.y = Math.sin(elapsed * 0.65 + index * 0.9) * 0.08;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, Math.PI + (index - 1.5) * 0.16, 0]} scale={0.88}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0.07]}>
        <circleGeometry args={[0.42, 28]} />
        <meshBasicMaterial color={color} transparent opacity={member.active ? 0.34 : 0.2} />
      </mesh>

      <mesh castShadow position={[0, 0.86, 0]}>
        <capsuleGeometry args={[0.27, 0.46, 5, 10]} />
        <meshStandardMaterial color={color} roughness={0.58} metalness={0.02} />
      </mesh>
      <mesh castShadow position={[0, 1.17, 0.018]}>
        <boxGeometry args={[0.44, 0.08, 0.31]} />
        <meshStandardMaterial color={accent} roughness={0.52} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0.06]}>
        <sphereGeometry args={[0.33, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.68, 0.02]} scale={[1.04, 0.62, 1.02]}>
        <sphereGeometry args={[0.34, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color={hairColor} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[-0.11, 1.52, 0.34]}>
        <sphereGeometry args={[0.029, 8, 8]} />
        <meshBasicMaterial color={eye} />
      </mesh>
      <mesh castShadow position={[0.11, 1.52, 0.34]}>
        <sphereGeometry args={[0.029, 8, 8]} />
        <meshBasicMaterial color={eye} />
      </mesh>
      <mesh position={[0, 1.42, 0.35]} scale={[1.3, 0.42, 0.7]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial color="#c77d65" transparent opacity={0.48} />
      </mesh>

      <Limb start={[-0.28, 1.03, 0.02]} end={[-0.52, 0.7, 0.2]} radius={0.055} color={darker} />
      <Limb start={[0.28, 1.03, 0.02]} end={[0.52, 0.7, 0.2]} radius={0.055} color={darker} />
      <Limb start={[-0.13, 0.56, 0]} end={[-0.22, 0.12, 0.08]} radius={0.065} color={darker} />
      <Limb start={[0.13, 0.56, 0]} end={[0.22, 0.12, 0.08]} radius={0.065} color={darker} />
      <mesh castShadow position={[-0.26, 0.08, 0.11]} scale={[1.3, 0.48, 0.8]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#26332d" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.26, 0.08, 0.11]} scale={[1.3, 0.48, 0.8]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#26332d" roughness={0.7} />
      </mesh>

      <AvatarProp avatar={avatar} color={accent} />
    </group>
  );
}

type LimbProps = {
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
  color: string;
};

function Limb({ start, end, radius, color }: LimbProps) {
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
    <mesh castShadow position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius * 0.78, radius, length, 10]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

function AvatarProp({ avatar, color }: { avatar: string; color: string }) {
  if (avatar === "guardian") {
    return (
      <mesh castShadow position={[0.56, 0.76, 0.27]} rotation={[0.1, 0, -0.22]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.04} />
      </mesh>
    );
  }

  if (avatar === "healer") {
    return (
      <group position={[0.55, 0.74, 0.3]} rotation={[0.1, 0, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.32, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (avatar === "keeper") {
    return (
      <mesh castShadow position={[-0.53, 0.82, 0.25]} rotation={[0.12, 0.18, 0.32]}>
        <boxGeometry args={[0.26, 0.2, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    );
  }

  return (
    <mesh castShadow position={[-0.5, 0.96, 0.28]} rotation={[0.2, 0.08, 0.5]}>
      <torusGeometry args={[0.13, 0.025, 8, 20, Math.PI * 1.45]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}
