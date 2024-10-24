import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Providers from "./providers";
import { ConnectContext } from "./contexts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Covault",
  description: "Covault is the answer for Non-Custodial DeFi on Bitcoin layer 1; built to satisfy increasing demand for secure, transparent and decentralized asset management.  ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="bg-[#131416] h-screen overflow-auto">
            <ConnectContext>
              <Header />
              {children}
            </ConnectContext>
          </div>
        </Providers>
      </body>
    </html>
  );
}
