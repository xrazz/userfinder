import '@radix-ui/themes/styles.css';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Theme } from '@radix-ui/themes';
// import { AuthProvider } from './context/AuthContext';

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
  title: "UserFinder AI",
  description: "Made for Saas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body

        className={`${geistSans.variable} ${geistMono.variable}  antialiased`}
      >

        
        <Theme className='font-medium'> 
        
        {children}
        

        </Theme>
      </body>
    </html>
  );
}
