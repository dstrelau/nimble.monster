export const maybePeriod = (s: string | undefined) => {
  if (!s) return "";
  if (s && (s.endsWith(".") || s.endsWith("!") || s.endsWith("?"))) {
    return s;
  }
  return `${s}.`;
};
