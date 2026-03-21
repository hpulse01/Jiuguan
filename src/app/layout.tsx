import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "酒馆 - 别人都在教你成功，酒馆告诉你如何避开失败",
  description:
    "酒馆是一个分享失败经历的社区。在这里，我们坦诚地讨论失败案例，帮助彼此在人生和事业中避开那些常见的坑。别人都在教你成功，酒馆告诉你如何避开失败。",
  keywords: ["失败案例", "经验分享", "避坑指南", "酒馆", "社区"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
