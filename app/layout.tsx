import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;
  return {
    title: "严明曦的五岁星星旅程",
    description: "从悉尼出发，收藏严明曦和朋友们一起走过的六站旅行记忆。",
    icons: { icon: "/invitation-bg.png" },
    openGraph: {
      title: "严明曦的五岁星星旅程",
      description: "8月19日，一起打开属于严明曦的生日旅行地图。",
      type: "website",
      images: [{ url: socialImage, width: 1744, height: 910, alt: "严明曦的五岁星星旅程" }],
    },
    twitter: { card: "summary_large_image", title: "严明曦的五岁星星旅程", images: [socialImage] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" href="/fonts/lxgwwenkailite-regular.css" as="style" />
        <link rel="stylesheet" href="/fonts/lxgwwenkailite-regular.css" />
        <link rel="preload" href="/fonts/xiaolai/result.css" as="style" />
        <link rel="stylesheet" href="/fonts/xiaolai/result.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
