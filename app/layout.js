import { Inter, Nabla } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nabla = Nabla({ subsets: ["latin"], variable: "--font-nabla" });

export const metadata = {
  title: "BasePump - Farcaster Mini App",
  description: "Create token listings on Base Network",
  openGraph: {
    title: "BasePump - Farcaster Mini App",
    description: "Create and trade meme tokens on Base",
    images: [`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/og.png`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/og.png`,
    "fc:frame:button:1": "Launch BasePump",
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
        <meta property="fc:frame:button:1" content="Launch BasePump" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content={process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'} />
      </head>
      <body className={`${inter.className} ${nabla.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}