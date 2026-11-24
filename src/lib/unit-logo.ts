type LogoSource = { logo_url?: string | null };

function isRealImage(url: string | null | undefined): url is string {
  return !!url && !url.startsWith("/uploads/dummy/");
}

export function unitLogoUrl(unit: LogoSource, foundationLogo?: string | null): string {
  if (isRealImage(unit.logo_url)) return unit.logo_url;
  if (isRealImage(foundationLogo)) return foundationLogo;
  return "/logo.png";
}
