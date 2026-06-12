export const formatCount = (count: number) => {
  if (!count || count < 0) return "0";
  return count > 99 ? "99+" : String(count);
};
