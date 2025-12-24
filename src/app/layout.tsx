import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "私募管理系统",
  description: "专业的私募基金数据分析与可视化平台，提供实时业绩监控和策略分析",
};

import { DashboardProvider } from "@/contexts/DashboardContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased font-sans">
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
