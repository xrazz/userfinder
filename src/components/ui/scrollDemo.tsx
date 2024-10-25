"use client";
import React from "react";
import { ContainerScroll } from "../ui/container-scroll-animation";
import Image from "next/image";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
  
               
            </h1>
          </>
        }
      >
        <Image
  src={`/demo.png`}
  alt="hero"
  height={700}
  width={1400}
  className="  rounded-2xl object-fill h-full object-left-top"
  draggable={false}
/>

      </ContainerScroll>
    </div>
  );
}
