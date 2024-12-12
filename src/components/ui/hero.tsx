'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"

interface CardProps {
  avatar: string;
  text: string;
  supporters: string;
  rotation: string;
}

export default function Hero() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

   

  return (
    <section
      ref={sectionRef}
      className="relative w-full pt-12 mb-5 md:py-2 lg:py-20 xl:pt-48 overflow-hidden"
    >



      <div className="container relative z-10 mx-auto px-4 pt-1">
        <div className="flex flex-col items-center space-y-8 text-center">
          <h1 className="text-4xl font-bold font-sans tracking-tighter sm:text-5xl md:text-4xl lg:text-5xl">
            <span className="flex">
              Find Your Perfect Customers
            </span>
            {/* <span className="inline-block bg-black text-white px-4 py-2 rounded-lg mt-2">
              Customers
            </span> */}

          </h1>

          <p className="max-w-[700px] text-base font-medium text-gray-700 dark:text-gray-300 md:text-lg lg:text-xl">

            Discover and validate your niche, locate targeted users, introduce your product, and gain new users. All within hours!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button asChild className="bg-black text-white hover:bg-gray-800 group py-8 px-12 rounded-full text-xl font-semibold min-w-[200px]">
              <a href="/search">
                Try Free Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}