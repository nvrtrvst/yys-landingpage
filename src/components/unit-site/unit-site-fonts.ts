import localFont from "next/font/local";

export const unitSiteBaloo = localFont({ src: "../../fonts/Baloo2.ttf", weight: "600 700", variable: "--font-baloo", display: "swap" });
export const unitSiteNunito = localFont({ src: "../../fonts/Nunito.ttf", weight: "400 700", variable: "--font-nunito", display: "swap" });
export const unitSiteFontClass = `${unitSiteBaloo.variable} ${unitSiteNunito.variable}`;
