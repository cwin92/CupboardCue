import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { APP_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${APP_NAME} MVP`,
  description: "A visual menu for what you already have.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5f9a4e"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="root-shell">{children}</div>
      </body>
    </html>
  );
}
