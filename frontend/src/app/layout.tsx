import type { Metadata } from "next";
import { SocketProvider } from "@/components/SocketProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoSpark · MKCE Campus — Smart Sewage Monitoring System",
  description:
    "SDG 11 · Real-time sewage water-level monitoring for M. Kumarasamy College of Engineering (MKCE), Karur. Live sensor data, weather-aware alerts, and AI-powered analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
