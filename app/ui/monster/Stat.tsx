import {
  ArrowBigRightDash,
  Heart,
  Mountain,
  Pickaxe,
  Send,
  Shield,
  Star,
  Waves,
  Zap,
} from "lucide-react";

// Icon aliases for consistent usage across components
export const HPIcon = Heart;
export const ArmorIcon = Shield;
export const SavesIcon = Star;
export const SpeedIcon = ArrowBigRightDash;
export const SwimIcon = Waves;
export const FlyIcon = Send;
export const ClimbIcon = Mountain;
export const BurrowIcon = Pickaxe;
export const TeleportIcon = Zap;

export const Stat: React.FC<{
  name: string;
  value: string | number;
  showZero?: boolean;
  SvgIcon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  children?: React.ReactNode;
  fillColor?: string;
  strokeColor?: string;
}> = ({
  name,
  value,
  showZero = false,
  children,
  SvgIcon,
  fillColor = "var(--color-gray-200)",
  strokeColor = "var(--color-gray-300)",
}) => {
  if (!value && !children && !showZero) return null;
  return (
    <span
      id={name}
      className="flex items-center ml-2 text-lg text-content leading-6 py-1"
    >
      <SvgIcon
        className={`w-7 h-7 -mr-[6px]`}
        style={{
          fill: fillColor,
          stroke: strokeColor,
        }}
      />
      {value}
      {children}
    </span>
  );
};

export const HPStat: React.FC<{ value: string | number }> = ({ value }) => (
  <Stat
    name="hp"
    value={value}
    SvgIcon={HPIcon}
    strokeColor="var(--red)"
    fillColor="var(--red)"
  />
);

export const ArmorStat: React.FC<{ value: "M" | "H" }> = ({ value }) => (
  <Stat name="armor" value={value} SvgIcon={ArmorIcon} />
);

export const SavesStat: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Stat name="saves" value="" SvgIcon={SavesIcon}>
    {children}
  </Stat>
);
