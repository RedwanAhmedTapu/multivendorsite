import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/publicnavbar/Navbar";
import ReduxProvider from "@/context/ReduxProvider";
import MobileBottomNav from "@/components/movilebottomnav/MobileBottomNav";
import SessionReplayBoot from "@/components/analytics/SessionReplayBoot";
import { ProductCardConfigProvider } from "@/components/product/card/ProductCardConfigProvider";
import { getPublishedProductCardConfig } from "@/lib/theme-utils";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { Toaster } from "sonner";

config.autoAddCss = false;

// Primary font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

// Heading font
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://finixmart.com.bd"),

  title: {
    default: "FinixMart: One-Stop Shop for All Your Needs",
    template: "%s | FinixMart",
  },

  description:
    "Bangladesh's trusted multi-vendor ecommerce marketplace.",

  applicationName: "FinixMart",

  icons: {
    icon: [
      {
        url: "/finixmart-favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/finixmart-favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/finixmart-favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],

    shortcut: "/finixmart-favicon-32x32.png",

    apple: "/finixmart-favicon-48x48.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Global product card design for every listing below (never throws; defaults on any problem).
  const productCardConfig = await getPublishedProductCardConfig();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        {/* FontAwesome CDN as backup */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>

      <body className="font-sans antialiased">
        <ReduxProvider>
          <Navbar />

          <ProductCardConfigProvider config={productCardConfig}>{children}</ProductCardConfigProvider>

          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "group toast",
                title: "text-sm font-semibold",
                description: "text-sm opacity-90",

                actionButton:
                  "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",

                cancelButton:
                  "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",

                success:
                  "bg-green-50 border-green-200 text-green-900",

                error:
                  "bg-red-50 border-red-200 text-red-900",

                warning:
                  "bg-yellow-50 border-yellow-200 text-yellow-900",

                info:
                  "bg-blue-50 border-blue-200 text-blue-900",
              },
            }}
          />

          <MobileBottomNav />
          {/* visual session replay — off unless explicitly enabled for synthetic testing */}
          <SessionReplayBoot />
        </ReduxProvider>
      </body>
    </html>
  );
}