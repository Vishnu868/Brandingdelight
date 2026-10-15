import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Toaster } from "@/components/Toaster";
import { getCategories } from "@/lib/catalog";
import { SITE } from "@/lib/format";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "BrandingDelight — Premium Brands & Corporate Gifting Store", template: "%s | BrandingDelight" },
  description:
    "Shop 790+ premium products from Lifelong, SMOOR, Tamta, FUZO, HRX, LOYKA, Unwrap Happiness and more. Festive hampers, copper bottles, appliances, tech and luggage with custom branding for corporate gifting. Pay by UPI, cards, Amex, net banking.",
  openGraph: { siteName: "BrandingDelight", type: "website", locale: "en_IN" },
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#7b1e2b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh">
        <AuthProvider>
          <Header categories={categories} />
          <main className="min-h-[60vh] pb-20 lg:pb-0">{children}</main>
          <Footer categories={categories} />
          <MobileTabBar />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
