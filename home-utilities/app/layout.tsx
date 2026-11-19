import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hearth · Home utilities",
  description: "Your home’s utilities, together.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
