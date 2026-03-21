import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Navbar from "@/components/navbar";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Nanu's World 🌍",
  description: "A fun digital scrapbook of Nanu's adventures, funny quotes, and memories — created by Dad with love ❤️",
  openGraph: {
    title: "Nanu's World 🌍",
    description: "A fun digital scrapbook of Nanu's adventures, funny quotes, and memories — created by Dad with love ❤️",
    type: "website",
    siteName: "Nanu's World",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nanu's World 🌍",
    description: "A fun digital scrapbook of Nanu's adventures, funny quotes, and memories",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
