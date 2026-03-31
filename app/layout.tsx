import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DetectAI — Is It AI or Human-Written? Multi-Engine AI Detector",
  description: "Check if text is AI-generated using 5 detection engines simultaneously. More accurate than any single AI detector. Free AI content checker for students, writers, and educators.",
  keywords: "AI detector, AI content detector, check if AI written, GPTZero alternative, detect ChatGPT, AI checker, AI writing detector, is it AI, detect AI text, AI plagiarism checker, free AI detector",
  openGraph: {
    title: "DetectAI — Multi-Engine AI Content Detector",
    description: "Scan text through 5 AI detection engines at once. Get a consensus score more accurate than any single detector. Free to use.",
    url: "https://detectai.com",
    siteName: "DetectAI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DetectAI — Multi- AI Content Detector",
    description: "Scan text through 5 AI detection engines at once. More accurate than any single detector.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://detectai.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
