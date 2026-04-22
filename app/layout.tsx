import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://free-barcode-generator.baikolife.com"),

  title: {
    default: "Free Barcode Generator by Baiko",
    template: "%s | Baiko",
  },

  description:
    "Generate free EAN-13 barcode numbers and barcode JPG images online. Fast, simple and free barcode generator for products, inventory, labels and sellers.",

  keywords: [
    "free barcode generator",
    "EAN13 barcode generator",
    "barcode generator India",
    "GTIN barcode tool",
    "product barcode generator",
    "generate barcode jpg",
    "inventory barcode generator",
    "barcode maker online",
    "Baiko barcode tool"
  ],

  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },

  authors: [{ name: "Baiko" }],
  creator: "Baiko",
  publisher: "Baiko",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title: "Free Barcode Generator by Baiko",
    description:
      "Generate EAN-13 barcode numbers and barcode JPG images instantly.",
    url: "https://free-barcode-generator.baikolife.com",
    siteName: "Baiko",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Free Barcode Generator by Baiko",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Free Barcode Generator by Baiko",
    description:
      "Generate EAN-13 barcode numbers and barcode JPG images instantly.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://free-barcode-generator.baikolife.com",
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
