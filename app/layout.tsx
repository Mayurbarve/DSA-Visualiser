import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlgoAtlas — learn DSA by watching it run",
  description:
    "Type a LeetCode problem number and get brute force, better and optimal solutions, a plain-English explanation, a frame-by-frame visualisation, complexity analysis and company frequency.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${mono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
