import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const generalSans = localFont({
  variable: "--font-display",
  src: [
    { path: "../public/fonts/GeneralSans-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/GeneralSans-Italic.otf", weight: "400", style: "italic" },
    { path: "../public/fonts/GeneralSans-Medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "../public/fonts/GeneralSans-Semibold.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/GeneralSans-SemiboldItalic.otf", weight: "600", style: "italic" },
    { path: "../public/fonts/GeneralSans-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/fonts/GeneralSans-BoldItalic.otf", weight: "700", style: "italic" },
  ],
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const trangels = localFont({
  variable: "--font-brand",
  src: [
    { path: "../public/fonts/Trangels-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Trangels-Italic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "NISA — Neural Interactive Systematic Assistant",
  description:
    "NISA V.3 — Your AI Operating System. One workspace, many capabilities.",
};

const themeScript = `try{var t="dark";var s=localStorage.getItem("nisa-db-v3");if(s){t=JSON.parse(s).state.theme||"dark";}if(t==="dark")document.documentElement.classList.add("dark");}catch(e){document.documentElement.classList.add("dark");}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${generalSans.variable} ${mono.variable} ${trangels.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
