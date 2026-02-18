import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "katex/dist/katex.min.css";
import "./globals.css";

const headline = Fraunces({
  subsets: ["latin"],
  variable: "--font-headline",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "redpen",
  description: "Adaptive interview assessments and reviewer analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headline.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
