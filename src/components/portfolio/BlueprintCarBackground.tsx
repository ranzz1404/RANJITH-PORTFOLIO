import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function WireframeCar() {
  const group = useRef<THREE.Group>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const speed = isMobile ? 0.15 : 0.35;

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * speed;
  });

  const lineMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color("#7dd3fc"), transparent: true, opacity: 0.9 }),
    []
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color("#e0f2fe"), transparent: true, opacity: 0.85 }),
    []
  );

  const bodyEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 0.8, 1.7)), []);
  const cabinEdges = useMemo(() => {
    const g = new THREE.BoxGeometry(2.2, 0.7, 1.5);
    return new THREE.EdgesGeometry(g);
  }, []);
  const hoodEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 0.15, 1.6)), []);
  const trunkEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 0.15, 1.6)), []);
  const wheelGeom = useMemo(() => {
    const g = new THREE.TorusGeometry(0.42, 0.14, 8, 20);
    return new THREE.EdgesGeometry(g);
  }, []);
  const rimGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.CircleGeometry(0.32, 12)), []);

  const wheels: Array<[number, number, number]> = [
    [-1.3, -0.4, 0.9],
    [1.3, -0.4, 0.9],
    [-1.3, -0.4, -0.9],
    [1.3, -0.4, -0.9],
  ];

  return (
    <group ref={group} position={[0, -0.2, 0]} rotation={[0.15, 0, 0]}>
      {/* body */}
      <lineSegments geometry={bodyEdges} material={edgeMat} />
      {/* cabin */}
      <lineSegments geometry={cabinEdges} material={edgeMat} position={[0, 0.75, 0]} />
      {/* hood */}
      <lineSegments geometry={hoodEdges} material={lineMat} position={[1.5, 0.45, 0]} />
      {/* trunk */}
      <lineSegments geometry={trunkEdges} material={lineMat} position={[-1.6, 0.45, 0]} />
      {/* wheels */}
      {wheels.map((p, i) => (
        <group key={i} position={p}>
          <lineSegments geometry={wheelGeom} material={lineMat} rotation={[Math.PI / 2, 0, 0]} />
          <lineSegments geometry={rimGeom} material={lineMat} rotation={[0, Math.PI / 2, 0]} />
        </group>
      ))}
      {/* ground reference cross */}
      <lineSegments material={lineMat}>
        <edgesGeometry args={[new THREE.PlaneGeometry(6, 3)]} attach="geometry" />
      </lineSegments>
    </group>
  );
}

export function BlueprintCarBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.2,
        background:
          "radial-gradient(ellipse at center, rgba(15,23,42,0.0) 0%, rgba(2,6,23,0.0) 60%)",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [4, 2.2, 5], fov: 40 }}
      >
        <ambientLight intensity={0.4} />
        <Suspense fallback={null}>
          <WireframeCar />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default BlueprintCarBackground;
