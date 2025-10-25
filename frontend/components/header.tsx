"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Zap } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-[#fa6724] to-[#07a6ec]">
              <div className="absolute inset-1 rounded-full bg-white dark:bg-black flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#fa6724]" />
              </div>
            </div>
            <span className="font-bold text-xl">ChainSure</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm font-medium hover:text-[#fa6724] transition-colors">
            Features
          </Link>
          <Link href="/blockchain" className="text-sm font-medium hover:text-[#fa6724] transition-colors">
            Blockchain
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-[#fa6724] transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-[#fa6724] transition-colors">
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          <Link href="/login">
            <Button variant="outline" className="border-[#07a6ec] text-[#07a6ec] hover:bg-[#07a6ec] hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#fa6724] hover:bg-[#e55613] text-white">Sign up</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <ModeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-4">
          <nav className="container flex flex-col gap-4">
            <Link
              href="/features"
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/blockchain"
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Blockchain
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="flex flex-col gap-2 mt-2 px-4">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full border-[#07a6ec] text-[#07a6ec]">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-[#fa6724] hover:bg-[#e55613]">Sign up</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

