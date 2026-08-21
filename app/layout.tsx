import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./form-enhancements.css";
import "./public-canva.css";
import "./dashboard-theme.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const socialTitle = "Join Meitu Indonesia's official CreatorHub.";
  const socialDescription =
    "Apply to join Meitu Indonesia's official CreatorHub for Meitu, BeautyCam, and Wink.";
  // Messaging apps cache preview images independently from page metadata.
  // Change this version whenever the social card changes so they fetch it again.
  const socialImage = new URL("/og.png?v=20260821", base).toString();
  return {
    metadataBase: base,
    title: socialTitle,
    description: socialDescription,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "Ready to Become a Meitu Creator?",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
