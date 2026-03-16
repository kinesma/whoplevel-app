import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhopLevel - Gamification Engine",
  description: "Points, streaks, badges & leaderboards for your Whop community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
