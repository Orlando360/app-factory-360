import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "App Factory 360 — Tu app personalizada en 24 horas",
  description:
    "Plataforma multi-agente que analiza el dolor de tu negocio y construye automáticamente una app web personalizada. Powered by Orlando 360.",
  keywords: ["app factory", "desarrollo web", "IA", "negocio", "automatización"],
  authors: [{ name: "Orlando 360" }],
  openGraph: {
    title: "App Factory 360 — Tu app personalizada en 24 horas",
    description:
      "Transforma el dolor de tu negocio en una app personalizada en 24 horas.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full bg-[#0A0A0A] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
