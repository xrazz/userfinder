import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Bookmark, LogOut, Sparkles, Crown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Cookies from 'js-cookie'
import Link from 'next/link'

interface HeaderProps {
    userId?: string
    name?: string
    email?: string
    imageUrl?: string
    onLogout: () => void
    subscriptionStatus?: string
}

export const Header: React.FC<HeaderProps> = ({ userId, name, email, imageUrl, onLogout, subscriptionStatus }) => {
    const router = useRouter()
    const [credits, setCredits] = useState<number>(0)
    const hasShownToast = useRef(false)

    useEffect(() => {
        if (!email) {
            const guestCredits = parseInt(Cookies.get('guestCredits') || '0');
            setCredits(guestCredits);

            if (guestCredits <= 1 && !hasShownToast.current) {
                hasShownToast.current = true;
                toast("Credits running low!", {
                    description: "Sign up to get 5 free credits daily.",
                    duration: 10000,
                    action: {
                        label: "Sign up now",
                        onClick: () => router.push('/login')
                    }
                });
            }
            return;
        }

        const userDocRef = doc(db, 'users', email)
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const currentCredits = docSnapshot.data().credits
                setCredits(currentCredits)
            }
        })

        return () => unsubscribe()
    }, [email, router])

    return (
        <header className="w-full px-4 md:px-6 py-4 flex justify-between items-center bg-background border-none">
            <div className="flex items-center">
                {/* Logo image commented out for now */}
                {/* <Image src="/logo.png" alt="Logo" width={150} height={150} /> */}
                
                {/* Stylish LEXY text logo */}
                <Link href="/" className="flex items-center gap-1.5 select-none">
                    <Search className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                        LEXY
                    </span>
                </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center gap-2">
                    <Badge 
                        variant={credits <= 1 ? "destructive" : "outline"} 
                        className="flex items-center gap-1"
                    >
                        <Sparkles className="h-3 w-3" />
                        {credits} credit{credits !== 1 ? 's' : ''} {!userId && 'remaining'}
                    </Badge>
                    {userId && subscriptionStatus !== 'active' && (
                        <Button 
                            variant="premium"
                            size="sm"
                            className="text-xs bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
                            onClick={() => router.push('/subscription')}
                        >
                            <Crown className="h-3.5 w-3.5 text-yellow-200" />
                            <span className="hidden sm:inline">Get 100 credits daily</span>
                            <span className="sm:hidden">Upgrade</span>
                        </Button>
                    )}
                </div>
                {userId ? (
                    <>
                        <Button onClick={() => router.push('/bookmarks')} variant="default" size="icon" className="rounded-full">
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
                                    {/* Show credits and premium button in mobile view */}
                                    <div className="sm:hidden space-y-3">
                                        <Badge 
                                            variant={credits <= 1 ? "destructive" : "outline"} 
                                            className="flex items-center gap-1 w-full justify-center py-1"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            {credits} credit{credits !== 1 ? 's' : ''} remaining
                                        </Badge>
                                        {userId && subscriptionStatus !== 'active' && (
                                            <Button 
                                                variant="premium"
                                                size="sm"
                                                className="w-full text-xs bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                                                onClick={() => router.push('/subscription')}
                                            >
                                                <Crown className="h-3.5 w-3.5 text-yellow-200" />
                                                Get 100 credits daily
                                            </Button>
                                        )}
                                    </div>
                                    <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </>
                ) : (
                    <>
                        <Button variant="outline" className='shadow-none text-sm' onClick={() => router.push('/login')}>Log in</Button>
                        <Button variant="default" className='shadow-none text-sm' onClick={() => router.push('/login')}>Sign up</Button>
                    </>
                )}
            </div>
        </header>
    )
} 