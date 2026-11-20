import { Baloo_2, Nunito } from "next/font/google";

export const unitSiteBaloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });
export const unitSiteNunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-nunito" });
export const unitSiteFontClass = `${unitSiteBaloo.variable} ${unitSiteNunito.variable}`;
