import type { ReactNode } from "react";
import type { Stars as StarCount } from "@/game/types";
import styles from "./controls.module.css";

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${styles.card} ${className ?? ""}`}>
      {title && <h2 className={styles.cardTitle}>{title}</h2>}
      {children}
    </section>
  );
}

export function Button({
  children,
  sub,
  variant = "default",
  disabled,
  onClick,
  className,
  title,
}: {
  children: ReactNode;
  sub?: ReactNode;
  variant?: "default" | "primary" | "ghost";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  const variantClass = variant === "primary" ? styles.primary : variant === "ghost" ? styles.ghost : "";
  return (
    <button type="button" className={`${styles.button} ${variantClass} ${className ?? ""}`} disabled={disabled} onClick={onClick} title={title}>
      <span>{children}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </button>
  );
}

/** 수량 선택 (− 값 +) */
export function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  label: string;
}) {
  return (
    <span className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`${label} 줄이기`} disabled={value - step < min} onClick={() => onChange(value - step)}>
        −
      </button>
      <span className={styles.stepperValue} aria-live="polite">
        {value}
        {unit}
      </span>
      <button type="button" aria-label={`${label} 늘리기`} disabled={value + step > max} onClick={() => onChange(value + step)}>
        +
      </button>
    </span>
  );
}

export function Meter({
  label,
  value,
  max = 100,
  level = "ok",
}: {
  label: ReactNode;
  value: number;
  max?: number;
  level?: "ok" | "warning" | "danger";
}) {
  return (
    <div className={styles.meter}>
      <div className={styles.meterLabel}>
        <span>{label}</span>
        <strong>
          {value}/{max}
        </strong>
      </div>
      <div className={styles.meterTrack} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={String(label)}>
        <div className={styles.meterFill} data-level={level} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

/** 칸 n개 중 on개 채움 (남은 행동, 카운트다운 등) */
export function Pips({ on, total, label }: { on: number; total: number; label: string }) {
  return (
    <span className={styles.pips} role="img" aria-label={`${label} ${on}/${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={styles.pip} data-on={i < on} />
      ))}
    </span>
  );
}

export function StarRow({ stars, max = 3 }: { stars: StarCount | null; max?: number }) {
  const n = stars ?? 0;
  return (
    <span className={styles.stars} aria-label={stars ? `최고 별 ${stars}개` : "아직 안 가봄"}>
      {"★".repeat(n)}
      <span className={styles.starsEmpty}>{"★".repeat(max - n)}</span>
    </span>
  );
}

export function Badge({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <span className={`${styles.badge} ${accent ? styles.badgeAccent : ""}`}>{children}</span>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}

export { styles as controlStyles };
