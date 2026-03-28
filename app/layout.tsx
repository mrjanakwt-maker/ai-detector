import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DetectAI — AI Content Detector | Multi-Engine AI Detection Tool",
  description:
    "Detect AI-generated text instantly with 5 detection engines. Like VirusTotal for AI content — paste any text and get a consensus score from multiple AI detectors. Free to use.",
  keywords: [
    "AI detector",
    "AI content detector",
    "ChatGPT detector",
    "AI writing detector",
    "detect AI text",
    "AI checker",
    "GPT detector",
    "AI generated content",
    "plagiarism checker",
    "AI writing checker",
  ],
  openGraph: {
    title: "DetectAI — Is it AI or Human-Written?",
    description:
      "Multi-engine AI content detection. 5 independent detection models scan your text simultaneously and return a consensus verdict. Free daily scans.",
    type: "website",
    url: "https://detectai.vercel.app",
    siteName: "DetectAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DetectAI — Multi-Engine AI Content Detector",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DetectAI — AI Content Detector",
    description:
      "Detect AI-generated text with 5 engines at once. Like VirusTotal for AI content.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://detectai.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#08080d] text-white antialiased">{children}</body>
    </html>
  );
}
