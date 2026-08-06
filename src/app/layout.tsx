import type { Metadata } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wealthdock.app"),
  title: {
    default: "WealthDock — Private personal finance",
    template: "%s · WealthDock",
  },
  description:
    "A private, local-first personal finance workspace for accounts, transactions, budgets, goals and debts.",
  applicationName: "WealthDock",
  category: "finance",
  keywords: [
    "personal finance",
    "budget",
    "local-first",
    "privacy",
    "open source",
  ],
  authors: [{ name: "MrBoodj011", url: "https://github.com/MrBoodj011" }],
  creator: "MrBoodj011",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  openGraph: {
    title: "WealthDock — Your finances. One clear place.",
    description: "Private, local-first and open-source personal finance.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
