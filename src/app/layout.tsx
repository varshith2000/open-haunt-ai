import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost in the Machine",
  description:
    "A haunted shell where an open-weight model running entirely on this machine whispers eerie commentary on the commands you type. Nothing executes. Nothing leaves your machine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
