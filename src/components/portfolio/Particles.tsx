import { useMemo } from "react";

export function Particles({ count = 40 }: { count?: number }) {
  const dots = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = 2 + Math.random() * 4;
      const isOrange = Math.random() > 0.5;
      return {
        id: i,
        size,
        top: Math.random() * 100,
        left: Math.random() * 100,
        color: isOrange ? "#FF6A00" : "#888888",
        opacity: 0.3 + Math.random() * 0.2,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 4,
        dx: (Math.random() - 0.5) * 60,
        dy: (Math.random() - 0.5) * 60,
      };
    });
  }, [count]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full particle-float"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background: d.color,
            opacity: d.opacity,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            ["--dx" as string]: `${d.dx}px`,
            ["--dy" as string]: `${d.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
