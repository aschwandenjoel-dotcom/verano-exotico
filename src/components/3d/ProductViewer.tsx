"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, MeshDistortMaterial, Float, Environment } from "@react-three/drei";
import type { Product } from "@/types";

function ClothingPlaceholder({ colors }: { colors: string[] }) {
  const primaryColor = colors[0] ?? "#FF3366";
  const secondaryColor = colors[1] ?? "#00D4FF";

  return (
    <group>
      <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.2}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.2, 1.6, 0.15]} />
          <MeshDistortMaterial
            color={primaryColor}
            distort={0.15}
            speed={1}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        <mesh position={[-0.9, 0.2, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.55, 1.1, 0.12]} />
          <MeshDistortMaterial
            color={primaryColor}
            distort={0.1}
            speed={1}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0.9, 0.2, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.55, 1.1, 0.12]} />
          <MeshDistortMaterial
            color={primaryColor}
            distort={0.1}
            speed={1}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.65, 0.7, 1.2, 32]} />
          <MeshDistortMaterial
            color={secondaryColor}
            distort={0.12}
            speed={1}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>
      </Float>
    </group>
  );
}

interface Props {
  product: Product;
}

export default function ProductViewer({ product }: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={20} color="#ffffff" />
      <pointLight position={[-5, 3, 3]} intensity={10} color="#FF3366" />
      <Environment preset="city" />

      <ClothingPlaceholder colors={product.colors} />
      <OrbitControls
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(3 * Math.PI) / 4}
        autoRotate
        autoRotateSpeed={1.5}
      />
    </Canvas>
  );
}
