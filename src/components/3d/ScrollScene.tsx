"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, useScroll, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

function ScrollObject() {
  const meshRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!meshRef.current) return;
    const offset = scroll.offset;
    meshRef.current.rotation.y = offset * Math.PI * 4;
    meshRef.current.rotation.x = offset * Math.PI * 2;
    meshRef.current.scale.setScalar(1 + offset * 0.5);
    meshRef.current.position.x = (offset - 0.5) * 4;
  });

  return (
    <Float floatIntensity={0.3} speed={2}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.2, 2]} />
        <MeshDistortMaterial
          color="#C8A97E"
          distort={0.5}
          speed={3}
          roughness={0.05}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function ScrollRings() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = scroll.offset * Math.PI * 2;
    groupRef.current.rotation.x = scroll.offset * Math.PI;
  });

  return (
    <group ref={groupRef}>
      {[1.8, 2.4, 3.0].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}>
          <torusGeometry args={[radius, 0.04, 16, 80]} />
          <meshStandardMaterial
            color={i === 0 ? "#E8320A" : i === 1 ? "#C8A97E" : "#F2EDE4"}
            emissive={i === 0 ? "#E8320A" : i === 1 ? "#C8A97E" : "#F2EDE4"}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ScrollScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 55 }} dpr={[1, 2]}>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} color="#E8320A" intensity={35} />
      <pointLight position={[-5, -5, 5]} color="#C8A97E" intensity={25} />
      <pointLight position={[0, 5, -5]} color="#F2EDE4" intensity={15} />

      <ScrollControls pages={1} damping={0.3}>
        <ScrollRings />
        <ScrollObject />
      </ScrollControls>
    </Canvas>
  );
}
