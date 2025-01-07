import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Bookmark, LogOut, Sparkles, Crown, HelpCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Cookies from 'js-cookie'
import Link from 'next/link'
import { getCreditManager } from '@/lib/credits'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
    userId?: string
    name?: string
    email?: string
    imageUrl?: string
    onLogout: () => void
    subscriptionStatus?: string
    subscriptionPlan?: string
}

const gradientTextStyle = {
    backgroundSize: '200% auto',
    animation: 'shine 3s linear infinite',
}

export const Header: React.FC<HeaderProps> = ({ userId, name, email, imageUrl, onLogout, subscriptionStatus, subscriptionPlan }) => {
    const router = useRouter()
    const [credits, setCredits] = useState<number>(0)
    const hasShownToast = useRef(false)

    useEffect(() => {
        const creditManager = getCreditManager(email)

        const updateCredits = async () => {
            await creditManager.resetDailyCredits()
            const currentCredits = await creditManager.getCredits()
            setCredits(currentCredits)
        }

        updateCredits()

        if (email) {
            const userDocRef = doc(db, 'users', email)
            const unsubscribe = onSnapshot(userDocRef, async () => {
                const currentCredits = await creditManager.getCredits()
                setCredits(currentCredits)
            })

            return () => unsubscribe()
        }
    }, [email, router])

    return (
        <header className="w-full px-4 md:px-6 py-4 flex justify-between items-center bg-background border-none">
            {/* <div className="flex items-center space-x-2">
                      <Image src="/logo-round.svg" alt="UserFinder AI Logo" width={40} height={40} />
          <span className="font-bold text-lg">Search</span>

                    </div> */}
            {/* <Image src="/logo.svg" alt="UserFinder AI Logo" width={30} height={30} /> */}

            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-1.5 select-none group">
                    <span
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-primary"
                        style={{
                            ...gradientTextStyle,
                        }}
                    >
                        LEXY
                    </span>
                </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {email && (
                        <Badge 
                            variant={credits <= 1 ? "destructive" : "secondary"}
                            className={`px-2 py-1 text-xs font-medium ${
                                credits <= 1 ? 'bg-red-200 text-red-700 hover:bg-red-300' : ''
                            }`}
                        >
                            <Sparkles className="mr-1 h-3 w-3" />
                            {credits} credit{credits !== 1 ? 's' : ''}
                        </Badge>
                    )}
                    {email && subscriptionPlan !== 'Pro' && (
                        <Button 
                            variant="outline"
                            size="sm"
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            onClick={() => router.push('/subscription')}
                        >
                            <Crown className="mr-1.5 h-3.5 w-3.5 text-yellow-200" />
                            <span className="hidden sm:inline">Upgrade to Pro</span>
                            <span className="sm:hidden">Pro</span>
                        </Button>
                    )}
                </div>
                {userId ? (
                    <>
                        <Button onClick={() => router.push('/bookmarks')} variant="ghost" size="icon" className="rounded-full">
                            <Bookmark className="h-5 w-5" />
                            <span className="sr-only">Bookmarks</span>
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={imageUrl || "/placeholder.svg?height=32&width=32"} alt={name} />
                                        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[260px] md:w-full" align="end" forceMount>
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={imageUrl || "/placeholder.svg?height=48&width=48"} alt={name} />
                                        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col space-y-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{name}</p>
                                        <p className="text-xs leading-none text-muted-foreground truncate">
                                            {email}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 pt-5 border-t space-y-3">
                                    <div className="sm:hidden space-y-3">
                                        {email && subscriptionPlan !== 'Pro' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 animate-gradient"
                                                onClick={() => router.push('/subscription')}
                                            >
                                                <Crown className="h-3.5 w-3.5 text-yellow-200" />
                                                Get 50 credits daily
                                            </Button>
                                        )}
                                    </div>
                                    <a
                                        href="mailto:info@lexy.uno"
                                        className="flex items-center w-full px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                                    >
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        info@lexy.uno
                                    </a>
                                    <Button 
                                        variant="ghost" 
                                        className="w-full px-3 py-2 h-auto font-normal text-sm justify-start hover:bg-muted" 
                                        onClick={onLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </>
                ) : (
                    <>
                        <Button variant="outline" className='shadow-none text-sm' onClick={() => router.push('/login')}>Log in</Button>
                        {/* <Button variant="default" className='shadow-none text-sm' onClick={() => router.push('/login')}>Sign up</Button> */}
                    </>
                )}
            </div>
        </header>
    )
} 