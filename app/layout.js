import { Inter, Nabla } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import GoogleAnalytics from "../app/components/GoogleAnalytics"; // ✅ client-only GA component

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nabla = Nabla({ subsets: ["latin"], variable: "--font-nabla" });

export const metadata = {
  title: "BasePump",
  description: "Only Memes no Value have Fun Share and Enjoy",
  openGraph: {
    title: "BasePump - Your Own MEME Creator",
    description: "Create Your Own MEME Easily",
    images: [`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/og.png`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/og.png`,
    "fc:frame:button:1": "Create Now",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Redundant Farcaster meta tags kept for safety */}
        <meta property="fc:frame" content="vNext" />
        <meta
          property="fc:frame:image"
          content={`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/og.png`}
        />
        <meta property="fc:frame:button:1" content="Create Now" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta
          property="fc:frame:button:1:target"
          content={process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}
        />
      </head>

      <body className={`${inter.className} ${nabla.variable}`}>
        <Providers>
          {children}
          <Toaster />

          {/* ✅ Client-side Google Analytics (no SSR crash) */}
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  );
}
