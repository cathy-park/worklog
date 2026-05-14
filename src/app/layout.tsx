import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TaskProvider } from "@/context/TaskContext";
import Sidebar from "@/components/Sidebar";
import ContentWrapper from "@/components/ContentWrapper";

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "WorkLog Auto | 행동 기반 자동 업무일지 생성",
  description: "업무 완료 체크만으로 자동으로 업무일지를 생성하는 스마트한 생산성 도구",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo_black.png",
    apple: "/logo_black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WorkLog Auto" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <TaskProvider>
          <ContentWrapper>
            {children}
          </ContentWrapper>
        </TaskProvider>
      </body>
    </html>
  );
}
