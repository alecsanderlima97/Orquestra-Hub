import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orquestra Hub | SaaS modular",
  description: "Sistema SaaS modular para gestao financeira, operacional e comercial.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Orquestra Hub" },
  icons: {
    apple: "/icons/orquestra-icon-192.png",
    icon: [
      { sizes: "32x32", url: "/icons/orquestra-icon-192.png" },
      { sizes: "192x192", url: "/icons/orquestra-icon-192.png" },
      { sizes: "512x512", url: "/icons/orquestra-icon-512.png" },
    ],
    shortcut: "/icons/orquestra-icon-192.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
