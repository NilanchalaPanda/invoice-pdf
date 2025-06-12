import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Invoice App",
  description:
    "An invoice management application built with Next.js and React.",
  keywords: "invoice, management, application, Next.js, React",
  openGraph: {
    title: "Invoice App",
    description:
      "An invoice management application built with Next.js and React.",
    url: "https://yourwebsite.com",
    siteName: "Invoice App",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children} <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
