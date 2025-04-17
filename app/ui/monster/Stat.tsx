export const Stat: React.FC<{
  name: string;
  value: string | number;
  SvgIcon: React.FC<{ className?: string }>;
  children?: React.ReactNode;
}> = ({ name, value, children, SvgIcon }) => {
  if (!value && !children) return null;
  return (
    <span
      id={name}
      className="flex items-center ml-2 text-lg text-content leading-6 py-1"
    >
      <SvgIcon className="w-7 -mr-[6px] stroke-base-300 fill-base-300" />
      {value}
      {children}
    </span>
  );
};
