import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "🧽 Sponge Club 1기 · 스터디 운영",
  description:
    "조별 발표 8분 타이머 · 발표 순서 랜덤 · 피드백 담당자 배정 · MVP 투표",
};

export const viewport: Viewport = {
  themeColor: "#0B1124",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-ink-950">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.07),transparent_55%)]" />
        {children}
      </body>
    </html>
  );
}
