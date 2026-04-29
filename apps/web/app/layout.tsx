import type { Metadata } from "next";
import { AppProviders } from "@/app/providers";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "Pilleus",
  description: "Pilleus Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
