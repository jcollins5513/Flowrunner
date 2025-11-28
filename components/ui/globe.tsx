"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Globe from "three-globe";

function GlobeComponent({
  data,
  globeConfig,
}: {
  data: Array<{
    order: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
  }>;
  globeConfig: {
    pointSize?: number;
    globeColor?: string;
    showAtmosphere?: boolean;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    emissive?: string;
    emissiveIntensity?: number;
    shininess?: number;
    polygonColor?: string;
    ambientLight?: string;
    directionalLeftLight?: string;
    directionalTopLight?: string;
    pointLight?: string;
    arcTime?: number;
    arcLength?: number;
    rings?: number;
    maxRings?: number;
    initialPosition?: { lat: number; lng: number };
    autoRotate?: boolean;
    autoRotateSpeed?: number;
  };
}) {
  const globeRef = useRef<THREE.Group>(null);
  const globeInstance = useRef<Globe | null>(null);

  useMemo(() => {
    if (!globeInstance.current) {
      globeInstance.current = new Globe();
      
      // Configure globe
      globeInstance.current.globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
      globeInstance.current.backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png");
      
      if (globeConfig.globeColor) {
        globeInstance.current.globeMaterial({ color: globeConfig.globeColor });
      }
      
      if (globeConfig.showAtmosphere) {
        globeInstance.current.atmosphereColor(globeConfig.atmosphereColor || "#FFFFFF");
        globeInstance.current.atmosphereAltitude(globeConfig.atmosphereAltitude || 0.1);
      }

      // Add arcs
      if (data && data.length > 0) {
        globeInstance.current
          .arcsData(data)
          .arcStartLat((d: any) => d.startLat)
          .arcStartLng((d: any) => d.startLng)
          .arcEndLat((d: any) => d.endLat)
          .arcEndLng((d: any) => d.endLng)
          .arcColor((d: any) => d.color)
          .arcAltitude((d: any) => d.arcAlt)
          .arcStroke((d: any) => [1, 1, 1, 0.4]);
      }
    }
  }, [data, globeConfig]);

  useFrame(() => {
    if (globeRef.current && globeInstance.current) {
      globeRef.current.add(globeInstance.current as any);
    }
  });

  return (
    <group ref={globeRef}>
      <ambientLight intensity={0.5} color={globeConfig.ambientLight || "#38bdf8"} />
      <directionalLight
        position={[-1, 0, 1]}
        intensity={0.5}
        color={globeConfig.directionalLeftLight || "#ffffff"}
      />
      <directionalLight
        position={[0, 1, 0]}
        intensity={0.5}
        color={globeConfig.directionalTopLight || "#ffffff"}
      />
      <pointLight
        position={[0, 0, 0]}
        intensity={1}
        color={globeConfig.pointLight || "#ffffff"}
      />
    </group>
  );
}

export function World({
  data,
  globeConfig,
}: {
  data: Array<{
    order: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
  }>;
  globeConfig: {
    pointSize?: number;
    globeColor?: string;
    showAtmosphere?: boolean;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    emissive?: string;
    emissiveIntensity?: number;
    shininess?: number;
    polygonColor?: string;
    ambientLight?: string;
    directionalLeftLight?: string;
    directionalTopLight?: string;
    pointLight?: string;
    arcTime?: number;
    arcLength?: number;
    rings?: number;
    maxRings?: number;
    initialPosition?: { lat: number; lng: number };
    autoRotate?: boolean;
    autoRotateSpeed?: number;
  };
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 300], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <GlobeComponent data={data} globeConfig={globeConfig} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={globeConfig.autoRotate !== false}
        autoRotateSpeed={globeConfig.autoRotateSpeed || 0.5}
      />
    </Canvas>
  );
}
