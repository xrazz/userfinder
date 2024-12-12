'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const NavItems = () => (
    <>
      <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">
        Features
      </a>
      {/* <a className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
        Pricing
      </a> */}
      <a className="text-sm font-medium hover:text-primary transition-colors" href="#growth">
        Examples
      </a>
      <a className="text-sm font-medium hover:text-primary transition-colors" href="/blogs">
        Blogs
      </a>
    </>
  )

  return (
    <header className={`px-4 lg:px-6 h-16 flex items-center fixed w-full z-50 transition-all duration-300 ${scrollY > 0 ? "bg-white/80 backdrop-blur-md shadow-sm" : ""}`}>
      <div className="container mx-auto flex items-center justify-between">
        <a className="flex items-center justify-center" href="#">
          <img src="/logo.svg" className="h-10 w-10 mr-1" alt="" />
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 mr-2 text-primary"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg> */}
          <span className="font-bold text-xl">UserFinder AI</span>
        </a>
        <nav className="hidden md:flex gap-9 items-center justify-center mr-20 flex-auto">
          <NavItems />
        </nav>
        <Button
          onClick={() => router.push('/login')}
          className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
        >
           Log in
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4">
              <NavItems />
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Log in
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
