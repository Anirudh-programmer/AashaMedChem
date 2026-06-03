import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import StyledJsxRegistry from "@/lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "AasaMedChem — Inventory & Order Management",
  description: "Professional chemical inventory and order management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="app-body">
          <StyledJsxRegistry>{children}</StyledJsxRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
