import { Inter, Nabla } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nabla = Nabla({ subsets: ["latin"], variable: "--font-nabla" });

export const metadata = {
  title: "BasePump",
  description: "Only Memes no Value have Fun Share and Enjoy",
  openGraph: {
    title: "BasePump-Your Own MEME Creator",
    description: "Create Your Own MEME Easily",
    images: [`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/og.png`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/og.png`,
    "fc:frame:button:1": "Create Now",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/og.png`} />
        <meta property="fc:frame:button:1" content="Create Now" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} />
      </head>
{/* ✅ Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      <body className={`${inter.className} ${nabla.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}