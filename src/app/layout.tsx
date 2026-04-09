import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: 'IntelliSecureX | Document Deception Engine',
  description: 'Identity-Aware Document Deception Engine for enterprise security.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#111827] text-foreground selection:bg-primary/20">
        <FirebaseClientProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
