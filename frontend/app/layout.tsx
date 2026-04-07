import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
    title: "BI Analytics - Odoo Dashboard",
    description: "Dashboard de Business Intelligence para Odoo POS",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark">
            <body className="min-h-screen bg-background font-sans antialiased">
                <QueryProvider>
                    {children}
                </QueryProvider>
            </body>
        </html>
    );
}
