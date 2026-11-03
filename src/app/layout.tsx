import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayCourtProvider } from "@/context/PlayCourtContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastBanner } from "@/components/ui/ToastBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlayCourt | Play More. Live More.",
  description:
    "Discover outstanding sports courts, share daily crew membership credits, join open community matches, and book effortlessly across Chandigarh, Mohali & Zirakpur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans bg-pc-cream text-pc-text">
        <PlayCourtProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <ToastBanner />
        </PlayCourtProvider>
      </body>
    </html>
  );
}

