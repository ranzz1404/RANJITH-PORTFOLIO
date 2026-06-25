import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

function Gear({
  position,
  scale,
  speed,
  floatAmp,
  floatSpeed,
  geo,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
  floatAmp: number;
  floatSpeed: number;
  geo: "torus" | "cyl";
}) {
  const ref = useRef<Mesh>(null);
  const base = position[1];
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed;
    ref.current.rotation.x += speed * 0.3;
    ref.current.position.y = base + Math.sin(state.clock.elapsedTime * floatSpeed) * floatAmp;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      {geo === "torus" ? (
        <torusGeometry args={[1, 0.35, 16, 32]} />
      ) : (
        <cylinderGeometry args={[1, 1, 0.3, 12]} />
      )}
      <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

export function GearsBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.6 }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[6, 6, 4]} intensity={2.2} color="#FF6A00" />
        <pointLight position={[-5, -3, 3]} intensity={0.6} color="#ffffff" />
        <Suspense fallback={null}>
          <Gear position={[-3.2, 0.8, 0]} scale={1.1} speed={0.005} floatAmp={0.3} floatSpeed={0.8} geo="torus" />
          <Gear position={[3, -0.5, -1]} scale={1.4} speed={-0.004} floatAmp={0.4} floatSpeed={0.6} geo="cyl" />
          <Gear position={[0, 1.5, -2]} scale={0.9} speed={0.006} floatAmp={0.25} floatSpeed={1.0} geo="torus" />
          <Gear position={[-1.5, -1.6, -1]} scale={0.7} speed={-0.007} floatAmp={0.35} floatSpeed={0.9} geo="cyl" />
          <Gear position={[2, 2, -3]} scale={0.6} speed={0.008} floatAmp={0.2} floatSpeed={1.2} geo="torus" />
        </Suspense>
      </Canvas>
    </div>
  );
}
