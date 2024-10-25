'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
 

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
   

 

  return (
    <>
      <div   className="h-1 w-full absolute top-0" />
      <nav
        className={`w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href='/'> 
        
        <div className="flex items-center space-x-2">
            
            <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
            <span className="font-bold text-lg">Blog</span>
          </div>
        </Link>
          
          <div className="flex items-center space-x-4">
             
             
            <Button asChild>
              <Link href="/login">Try UserFinder AI</Link>
            </Button>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar