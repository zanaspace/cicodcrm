import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CICOD CRM",
  description: "CICOD customer and catalogue management",
};

import { Toaster } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint so there is no light flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("crm-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body className={`${inter.variable} ${sora.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <Toaster />
        <AppLayout>
          {children}
        </AppLayout>
        
      </body>
    </html>
  );
}
