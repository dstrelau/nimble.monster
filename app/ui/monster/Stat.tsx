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
import { cn } from "@/lib/utils";

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
  className?: string;
  iconClassName?: string;
}> = ({
  name,
  value,
  showZero = false,
  children,
  SvgIcon,
  className,
  iconClassName,
}) => {
  if (!value && !children && !showZero) return null;
  return (
    <span
      id={name}
      className={cn(
        "h-fit flex items-center ml-2 text-lg text-content font-bold leading-6",
        className
      )}
    >
      <SvgIcon
        className={cn(
          "w-7 h-7 -mr-[4px] stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700",
          iconClassName
        )}
      />
      {value}
      {children}
    </span>
  );
};

export const HPStat: React.FC<{
  className?: string;
  value: string | number;
}> = ({ className, value }) => (
  <Stat
    name="hp"
    value={value}
    SvgIcon={HPIcon}
    className={className}
    iconClassName={"-mr-[3px] stroke-hp fill-hp dark:stroke-hp dark:fill-hp"}
    showZero={true}
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
