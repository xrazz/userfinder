import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Bookmark, LogOut } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
    userId?: string
    name?: string
    email?: string
    imageUrl?: string
    onLogout: () => void
}

export const Header: React.FC<HeaderProps> = ({ userId, name, email, imageUrl, onLogout }) => {
    const router = useRouter()

    return (
        <header className="w-full -mt-5 px-6 flex justify-between items-center bg-background border-none">
            <div className="flex items-center">
                <Image src="/logo.png" alt="Logo" width={150} height={150} />
            </div>
            <div className="flex items-center space-x-4">
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
                            <PopoverContent className="w-full" align="end" forceMount>
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={imageUrl || "/placeholder.svg?height=48&width=48"} alt={name} />
                                        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {email}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 pt-5 border-t">
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
                        <Button variant="outline" className='shadow-none' onClick={() => router.push('/login')}>Log in</Button>
                        <Button variant="default" className='shadow-none' onClick={() => router.push('/login')}>Sign up</Button>
                    </>
                )}
            </div>
        </header>
    )
} 