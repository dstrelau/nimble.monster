export const maybePeriod = (s: string) => {
  if (s && (s.endsWith(".") || s.endsWith("!") || s.endsWith("?"))) {
    return s;
  }
  return `${s}.`;
};
