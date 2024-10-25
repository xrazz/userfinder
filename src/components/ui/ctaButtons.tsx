'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowRight, Rocket } from "lucide-react"

export default function GetStarted() {
  const router = useRouter()

  return (
    <>
      <style jsx global>{`
        @keyframes darkShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .dark-shimmer-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, 
            hsl(222, 47%, 11%), 
            hsl(222, 47%, 18%), 
            hsl(222, 47%, 11%)
          );
          background-size: 200% 100%;
          animation: darkShimmer 3s infinite;
          border: none;
        }
        .dark-shimmer-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: 0.5s;
        }
        .dark-shimmer-button:hover::before {
          left: 100%;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-8">
        <Button 
          onClick={() => router.push('/login')} 
          className="dark-shimmer-button w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
          aria-label="Get Started"
        >
          <span className="mr-2 relative z-10">Get Started</span>
          <ArrowRight className="h-5 w-5 relative z-10" />
        </Button>
        <Button 
          onClick={() => router.push('/login')} 
          variant="outline"
          className="w-full sm:w-auto px-8 py-3 border-2 hover:bg-secondary hover:text-secondary-foreground transition-all duration-200"
          aria-label="Try Demo"
        >
          <Rocket className="mr-2 h-5 w-5" />
          <span>Try Demo</span>
        </Button>
      </div>
    </>
  )
}