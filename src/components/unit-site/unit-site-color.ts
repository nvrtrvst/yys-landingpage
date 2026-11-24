export const DEFAULT_UNIT_PRIMARY = "#14532d";
export const DEFAULT_UNIT_SECONDARY = "#fef08a";

let inkCache: { source: string; value: string } | null = null;

export function contrastInk(value: string): string {
  if (inkCache?.source === value) return inkCache.value;
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value.slice(1) : DEFAULT_UNIT_PRIMARY.slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const raw = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const ink = luminance > 0.4 ? "#1b2b1f" : "#ffffff";
  inkCache = { source: value, value: ink };
  return ink;
}