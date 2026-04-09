"use client"

import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()
  
  // Minimal footer for auth pages
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup')

  return (
    <footer className="w-full border-t py-6 bg-card text-muted-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium uppercase tracking-[0.2em]">
        <div>
          SECURE SESSION GATEWAY - Powered by CallTrack BPO Management
        </div>
        <div className="flex gap-6">
          <span>&copy; {new Date().getFullYear()} Enterprise Solutions</span>
          {!isAuthPage && (
            <>
              <span className="cursor-pointer hover:text-primary transition-colors">Compliance</span>
              <span className="cursor-pointer hover:text-primary transition-colors">Privacy</span>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}