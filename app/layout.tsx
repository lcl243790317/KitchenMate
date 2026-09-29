import type { Metadata } from "next";
import "./globals.css";
import { KitchenApp } from "@/components/kitchen-app";
export const metadata: Metadata = {
  title: "今天吃什么 · KitchenMate",
  description: "从厨房现有食材出发，找到今天的一餐。",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <KitchenApp />
        {children}
      </body>
    </html>
  );
}
