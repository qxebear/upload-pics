import "./globals.css";

import type { Metadata } from "next";
import { Geist_Mono, Roboto_Flex, Roboto_Mono } from "next/font/google";

import { AppRouterCacheProvider as MUIAppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { ThemeProvider } from "@/contexts/ThemeContext";
import MuiThemeWrapper from "@/contexts/MuiThemeContext";
import MainContent from "./base";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Upload Pics",
  description:
    "Easily upload and store your images — either permanently or temporarily. Perfect for quick temporary sharing or building a lasting image library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${robotoFlex.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-loader"
          data-cfasync="false"
          dangerouslySetInnerHTML={{
            __html: `!(function(){try{const t=document.documentElement,a=t.classList;a.remove("light-theme","dark-theme"),t.removeAttribute("data-theme");const r=localStorage.getItem("theme");if(r&&"system"!==r)t.setAttribute("data-theme",r),a.add(r),(t.style.colorScheme=r);else{const l=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";t.setAttribute("data-theme",l),a.add(l),(t.style.colorScheme=l)}}catch(o){console.error("[🖌️ Theme] Error applying theme:",o)}})()`,
          }}
          type="text/javascript"
        ></script>
      </head>
      <body
        className={`relative min-h-screen overflow-x-hidden antialiased`}
        suppressHydrationWarning
        dir="ltr"
      >
        <MUIAppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>
            <MuiThemeWrapper>
              <MainContent>{children}</MainContent>
            </MuiThemeWrapper>
          </ThemeProvider>
        </MUIAppRouterCacheProvider>
      </body>
    </html>
  );
}
