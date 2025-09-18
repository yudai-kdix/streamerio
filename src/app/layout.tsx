export const metadata = {
  title: "Streamerio Viewer",
  description: "配信視聴者向け操作ページ",
};

import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

