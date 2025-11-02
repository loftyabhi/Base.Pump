import { Inter, Nabla } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nabla = Nabla({ subsets: ["latin"], variable: "--font-nabla" });

export const metadata = {
  title: "BasePump",
  description: "Create token listings on Base Network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${nabla.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
