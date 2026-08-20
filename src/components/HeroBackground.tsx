import { useEffect, useState } from "react";
import boutique from "@/assets/hero-boutique.jpg";
import maintenance from "@/assets/hero-maintenance.jpg";
import dev from "@/assets/hero-dev.jpg";
import memoire from "@/assets/hero-memoire.jpg";

const SLIDES = [
  { src: boutique, alt: "Boutique high-tech @lkof" },
  { src: maintenance, alt: "Maintenance et réparation informatique" },
  { src: dev, alt: "Développement web et mobile" },
  { src: memoire, alt: "Rédaction et accompagnement de mémoire" },
];

const DURATION = 6000;

export function HeroBackground() {
  const [index, setIndex] = useState(0);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAnimated(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), DURATION);
    return () => clearInterval(id);
  }, [animated]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt=""
          width={1920}
          height={1088}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out will-change-[opacity,transform]"
          style={{
            opacity: animated ? (i === index ? 1 : 0) : i === 0 ? 1 : 0,
            animation: animated && i === index ? "hero-kenburns 8s ease-out forwards" : undefined,
          }}
        />
      ))}
      {/* Overlays for contrast */}
      <div className="absolute inset-0 bg-[oklch(0.13_0.03_255)]/75" />
      <div className="absolute inset-0 gradient-hero opacity-60 mix-blend-multiply" />
      <div className="absolute inset-0 gradient-mesh opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background/70" />
    </div>
  );
}
