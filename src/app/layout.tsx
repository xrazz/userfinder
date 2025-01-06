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

const siteConfig = {
  name: "Lexy",
  url: "https://lexy.uno",
  description: "Lexy is an advanced AI-powered search engine that helps you find, analyze, and understand content across the web. With features like semantic search, content analysis, and multi-source synthesis, Lexy makes information discovery smarter and more efficient.",
  keywords: [
    "AI search engine",
    "semantic search",
    "content analysis",
    "intelligent search",
    "web search",
    "research tool",
    "information discovery",
    "AI-powered search",
    "smart search",
    "content synthesis",
    "web analysis",
    "search assistant"
  ],
  creator: "Lexy Team",
  themeColor: "#7C3AED", // Purple theme color
  socialImage: "https://lexy.uno/og-image.png"
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{
      url: siteConfig.socialImage,
      width: 1200,
      height: 630,
      alt: `${siteConfig.name} - AI-Powered Search Engine`
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.socialImage],
    creator: '@lexy_ai',
    site: '@lexy_ai',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'en-US': `${siteConfig.url}/en-US`,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: siteConfig.themeColor,
      },
    ],
  },
  other: {
    'msapplication-TileColor': siteConfig.themeColor,
    'theme-color': siteConfig.themeColor,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': siteConfig.name,
    'mobile-web-app-capable': 'yes',
    'application-name': siteConfig.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Schema.org markup for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": siteConfig.name,
              "url": siteConfig.url,
              "description": siteConfig.description,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${siteConfig.url}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
