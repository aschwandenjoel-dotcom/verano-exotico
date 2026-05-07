"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

function ClothShape({ position, color, speed = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.15;
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <torusKnotGeometry args={[0.6, 0.2, 128, 32]} />
        <MeshDistortMaterial
          color={color}
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

const PARTICLE_COUNT = 600;
const PARTICLE_POSITIONS = (() => {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 20;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  return arr;
})();

function ParticleField() {
  const positions = useMemo(() => PARTICLE_POSITIONS, []);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#C8A97E" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function GlowSphere() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05);
  });

  return (
    <Sphere ref={ref} args={[1.8, 64, 64]} position={[0, 0, -3]}>
      <MeshDistortMaterial
        color="#E8320A"
        distort={0.3}
        speed={1.5}
        transparent
        opacity={0.12}
        roughness={0}
      />
    </Sphere>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} color="#E8320A" intensity={50} />
      <pointLight position={[-5, -3, 3]} color="#C8A97E" intensity={35} />
      <pointLight position={[0, 5, -5]} color="#F2EDE4" intensity={20} />

      <Stars radius={80} depth={50} count={2000} factor={2} fade speed={0.3} />
      <ParticleField />
      <GlowSphere />

      <ClothShape position={[-2.5, 0.5, 0]} color="#E8320A" speed={0.8} />
      <ClothShape position={[2.5, -0.5, -1]} color="#C8A97E" speed={1.2} />
      <ClothShape position={[0, 1.5, -2]} color="#6B6B4A" speed={0.6} />
    </Canvas>
  );
}
