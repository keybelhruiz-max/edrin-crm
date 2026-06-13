import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: "Edrin Travel CRM",
  description: "CRM interno de Edrin Travel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
