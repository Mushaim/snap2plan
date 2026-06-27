import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snap2Plan — your fridge, planned",
  description: "Snap your fridge and get a week of meals + a grocery list, instantly.",
};
export const viewport: Viewport = { themeColor: "#fbf7f0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
