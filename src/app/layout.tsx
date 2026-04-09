import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { Navbar } from "@/components/Navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: 'CallTrack BPO Management | Enterprise Call Center Solutions',
  description: 'Professional BPO management system for tracking and managing call records.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}