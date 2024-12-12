'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'

export default function PremiumSuccessPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    handleConfetti()
  }, [])

  const handleConfetti = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
 
    const frame = () => {
      if (Date.now() > end) return;
 
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });
 
      requestAnimationFrame(frame);
    };
 
    frame();
  };
  
  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center     ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl mx-auto text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          className="flex justify-center"
        >
          <img src="/logo.svg" alt="Logo" className="h-20 w-auto" />
        </motion.div>

        <motion.h1
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-3xl font-bold tracking-tighter sm:text-3xl md:text-3  xl bg-clip-text     "
        >
          Welcome to Premium!
        </motion.h1>

        <motion.p
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-sm text-muted-foreground max-w-prose mx-auto"
        >
          You've unlocked a world of exclusive features and content. Get ready for an enhanced experience!
        </motion.p>

        <motion.div
          // initial={{ opacity: 0, y: 30 }}
          // animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-primary">Exclusive Content</span>
              <span className="text-sm text-muted-foreground">Unlock premium articles and videos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-primary">Priority Support</span>
              <span className="text-sm text-muted-foreground">Get help when you need it most</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-primary">Advanced Features</span>
              <span className="text-sm text-muted-foreground">Access powerful tools and analytics</span>
            </div>
          </div>
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <Button asChild size="lg" className="mt-8 px-8 py-6 text-lg group">
            <Link href="/search">
              Return to Search
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}