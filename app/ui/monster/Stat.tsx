import { Heart, Shield, Star } from "lucide-react";

export const Stat: React.FC<{
  name: string;
  value: string | number;
  SvgIcon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  children?: React.ReactNode;
  fillColor?: string;
}> = ({ name, value, children, SvgIcon, fillColor }) => {
  if (!value && !children) return null;
  return (
    <span
      id={name}
      className="flex items-center ml-2 text-lg text-content leading-6 py-1"
    >
      <SvgIcon
        className={`w-7 -mr-[6px]`}
        style={{
          fill: fillColor || "var(--fallback-bc,oklch(var(--bc)/0.1))",
          stroke: "none",
        }}
      />
      {value}
      {children}
    </span>
  );
};

export const HPStat: React.FC<{ value: string | number }> = ({ value }) => (
  <Stat name="hp" value={value} SvgIcon={Heart} fillColor="var(--red)" />
);

export const ArmorStat: React.FC<{ value: "M" | "H" }> = ({ value }) => (
  <Stat name="armor" value={value} SvgIcon={Shield} />
);

export const SavesStat: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Stat name="saves" value="" SvgIcon={Star}>
    {children}
  </Stat>
);
