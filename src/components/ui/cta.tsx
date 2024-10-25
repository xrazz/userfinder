'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CallToAction() {
    const router = useRouter()

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-black text-white rounded-3xl border border-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                            Ready to Find Your Perfect App Users?
                        </h2>
                        <p className="md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed opacity-90">
                            Join UserFinder AI today and start growing your app with targeted, authentic user connections.
                        </p>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                        <Button onClick={() => router.push('/contact')} variant="secondary" className="w-full">
                            Contact Us
                            <ArrowRight className="ml-2" />
                        </Button>

                        <p className="text-xs opacity-70 text-center w-full">
                            By signing up, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}