import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Gear({
  position,
  radius = 1,
  teeth = 14,
  thickness = 0.25,
  speed = 0.4,
  floatSpeed = 1,
  floatAmp = 0.25,
  color = "#9aa0a6",
}: {
  position: [number, number, number];
  radius?: number;
  teeth?: number;
  thickness?: number;
  speed?: number;
  floatSpeed?: number;
  floatAmp?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  const baseY = position[1];

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = radius;
    const inner = radius * 0.78;
    const segments = teeth * 2;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const r = i % 2 === 0 ? outer : inner;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius * 0.25, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 24,
    });
    geo.center();
    return geo;
  }, [radius, teeth, thickness]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.z += speed * 0.01;
      ref.current.position.y = baseY + Math.sin(t * floatSpeed) * floatAmp;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Piston({ position }: { position: [number, number, number] }) {
  const rod = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 2;
    const y = Math.sin(t) * 0.5;
    if (head.current) head.current.position.y = y;
    if (rod.current) {
      rod.current.position.y = y - 0.5;
      rod.current.scale.y = 1 + Math.abs(Math.cos(t)) * 0.05;
    }
  });
  return (
    <group position={position} rotation={[0, 0, 0]}>
      {/* Cylinder casing */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 32, 1, true]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Piston head */}
      <mesh ref={head}>
        <cylinderGeometry args={[0.46, 0.46, 0.35, 32]} />
        <meshStandardMaterial color="#c9ccd1" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Connecting rod */}
      <group ref={rod}>
        <mesh>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#FF6A00" metalness={0.7} roughness={0.3} emissive="#FF6A00" emissiveIntensity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 4]} intensity={2.4} color="#FF6A00" />
      <pointLight position={[-6, -3, 4]} intensity={1.1} color="#88aaff" />
      <directionalLight position={[0, 5, 5]} intensity={0.5} />

      <Gear position={[-3.2, 1.2, 0]} radius={1.3} teeth={16} speed={0.5} floatSpeed={0.9} color="#b8bdc4" />
      <Gear position={[-1.4, -0.4, -0.5]} radius={0.85} teeth={12} speed={-0.9} floatSpeed={1.2} color="#8a9099" />
      <Gear position={[2.6, 1.6, -0.8]} radius={1.0} teeth={14} speed={0.7} floatSpeed={1.0} color="#a8aeb6" />
      <Gear position={[3.2, -1.2, 0.2]} radius={0.7} teeth={10} speed={-1.1} floatSpeed={1.4} color="#9aa0a6" />
      <Gear position={[0.2, 2.2, -1.2]} radius={0.55} teeth={10} speed={1.4} floatSpeed={1.6} color="#FF6A00" />

      <Piston position={[1.2, -0.6, 0.4]} />
    </>
  );
}

// Scroll-driven camera: moves smoothly with scroll progress + subtle parallax.
// Reading scroll via a ref avoids re-rendering React on every scroll event.
function ScrollCamera() {
  const { camera } = useThree();
  const scrollRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollRef.current = window.scrollY / max;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Optional subtle pointer parallax (cheap, listener only updates refs).
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
        targetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useFrame((_, delta) => {
    const s = scrollRef.current;
    // Camera drifts along a gentle arc as the user scrolls down.
    const targetY = s * 1.8;
    const targetZ = 7 - s * 1.4;
    const px = targetRef.current.x;
    const py = targetRef.current.y;
    camera.position.x += (px - camera.position.x) * Math.min(1, delta * 2);
    camera.position.y += (targetY + py - camera.position.y) * Math.min(1, delta * 2);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 2);
    camera.lookAt(0, s * 1.0, 0);
  });

  return null;
}

export function ContinuousBackground() {
  const [enabled, setEnabled] = useState(true);
  const [active, setActive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) < 4) {
      setEnabled(false);
    }
  }, []);

  // Pause rendering when the tab is hidden (and resume on return).
  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!enabled || !mounted) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={active ? "always" : "demand"}
      >
        <Suspense fallback={null}>
          <Scene />
          <ScrollCamera />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default ContinuousBackground;
