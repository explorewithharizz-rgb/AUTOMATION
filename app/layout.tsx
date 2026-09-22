import type { Metadata } from "next";
import "./globals.css";

const googleVerificationCode =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION ||
  "google5cdf2c3225b497ac";

export const metadata: Metadata = {
  title: "BEWEB Social Automation",
  description:
    "BEWEB Social Automation helps users securely connect and publish content to YouTube, Facebook and Instagram from one dashboard.",
  verification: {
    google: googleVerificationCode,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-site-verification" content={googleVerificationCode} />
      </head>
      <body className="bg-background text-gray-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
