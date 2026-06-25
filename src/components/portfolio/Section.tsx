import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const defaultVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export function Section({
  id,
  label,
  title,
  children,
  variant,
  className = "",
}: {
  id: string;
  label?: string;
  title?: string;
  children: ReactNode;
  variant?: Variants;
  className?: string;
}) {
  return (
    <section id={id} className={`relative py-24 sm:py-32 px-4 sm:px-6 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={variant ?? defaultVariant}
        >
          {(label || title) && (
            <header className="mb-12">
              {label && <p className="hud-label text-accent">{label}</p>}
              {title && <h2 className="mt-2 text-4xl sm:text-5xl font-bold">{title}</h2>}
              <div className="mt-4 h-px w-16 bg-accent" />
            </header>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
