import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
