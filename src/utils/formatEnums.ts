/**
 * Converts uppercase or underscored text (like "IN_ACTIVE") 
 * into title case (e.g. "In Active").
 */
export const formatEnums = (text: string): string => {
  if (!text) return "";
  return text
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
