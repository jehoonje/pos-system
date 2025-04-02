"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();

  return (
    <html lang="kr">
      <head>
        <script
          defer
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        />
      </head>
      <body style={{ overflowX: "hidden" }}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div></div>}>
            <div style={{ position: "relative", minHeight: "100vh" }}>
              {children}
            </div>
          </Suspense>
        </QueryClientProvider>
      </body>
    </html>
  );
}
