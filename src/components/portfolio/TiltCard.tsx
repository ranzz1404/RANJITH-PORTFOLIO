import { useRef, useState, type ReactNode, type CSSProperties } from "react";

export function TiltCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, active: false });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 10, ry: px * 10, active: true });
  };
  const onLeave = () => setT({ rx: 0, ry: 0, active: false });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        ...style,
        transform: `perspective(800px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
        transition: t.active ? "transform 0.1s linear, box-shadow 0.3s" : "transform 0.4s ease-out, box-shadow 0.3s",
        boxShadow: t.active ? "0 20px 50px -10px rgba(255,106,0,0.35)" : "none",
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}
