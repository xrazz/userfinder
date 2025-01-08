import '@radix-ui/themes/styles.css';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Theme } from '@radix-ui/themes';
import ClientProvider from './providers/ClientProvider';
import { ThemeProvider } from './providers/ThemeProvider';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const myFont = localFont({
  src: './fonts/Iquost-Regular.woff2',
  display: 'swap',
})
export const metadata: Metadata = {
  title: "Lexy",
  description: "Search and analyze content"
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}  antialiased`}
      >
        <ThemeProvider>
          <Theme className='font-medium'> 
            <ClientProvider>
              {children}
            </ClientProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
