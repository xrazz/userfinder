'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bookmark, Settings2, ArrowUp, Search, Link2, LogOut, Check, PlusCircle } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, checkAndUpdateMembership, db, reduceUserCredit } from '@/app/firebaseClient'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TabDataSkeleton from '@/components/searchProgressUI'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Cookies from "js-cookie"
import { Badge } from '@radix-ui/themes'
import { Badge as ShadcnBadge } from '@/components/ui/badge'
import Link from 'next/link'
import SearchSummaryBot from './llm/SearchSummaryBot'
import ExpandableSearchResult from './llm/ExpandableSearchResult'

const MEMBERSHIP_LEVELS = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro'
} as const

enum DateFilter {
    Today = 'today',
    Week = 'last week',
    Latest = 'last 2 months',
    Oldest = 'last 2 years',
    Lifetime = 'no date filter'
}

interface Post {
    title: string
    link: string
    snippet: string
}

const sites = [
    { name: 'Reddit.com', icon: '/reddit.svg' },
    { name: 'Twitter.com', icon: '/twitter.svg' },
    { name: 'Quora.com', icon: '/quora.svg' },
    { name: 'news.ycombinator.com', icon: '/y-combinator.svg' },
    { name: 'Dev.to', icon: '/dev.svg' },
    { name: 'stackexchange.com', icon: '/stackexchange.svg' },
]

interface LoggedOutSettingsPopoverProps {
    selectedSite: string
    badgetext: string
    setSelectedSite: (site: string) => void
    resultCount: number
    currentFilter: string
    onValueChange?: (value: string) => void
}

const LoggedOutSettingsPopover: React.FC<LoggedOutSettingsPopoverProps> = ({ selectedSite, badgetext, setSelectedSite, resultCount, currentFilter, onValueChange }) => (
    <PopoverContent className="w-60 ml-5 shadow-none">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="site-select">Site</Label>
                <Select
                    value={selectedSite}
                    onValueChange={(value) => ['Reddit.com', 'Twitter.com'].includes(value) && setSelectedSite(value)}
                >
                    <SelectTrigger id="site-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map((site) => (
                            <SelectItem
                                key={site.name}
                                value={site.name}
                                disabled={!['Reddit.com', 'Twitter.com'].includes(site.name)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                        <Image src={site.icon} alt={site.name} width={16} height={16} className="mr-2" />
                                        {site.name}
                                    </div>
                                    {!['Reddit.com', 'Twitter.com'].includes(site.name) && (

                                        <Link href='/checkout'>

                                            <ShadcnBadge className="ml-2 text-xs rounded-full">
                                                {badgetext}
                                            </ShadcnBadge>
                                        </Link>

                                    )}
                                </div>
                            </SelectItem>

                        ))}
                        <SelectItem disabled={true} value="custom" className="border rounded-md">
                            <div className="flex items-center">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                <span>Custom Site</span>    <Link href='/checkout'>

                                    <ShadcnBadge className="ml-2 text-xs rounded-full">
                                        {badgetext}
                                    </ShadcnBadge>
                                </Link>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="result-count">Result Count</Label>
                <Select value={resultCount.toString()} onValueChange={onValueChange}>
                    <SelectTrigger id="result-count">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50].map((count) => (
                            <SelectItem key={count} value={count.toString()} disabled>
                                <div className="flex items-center justify-between w-full">
                                    <span>{count}</span>
                                    <Link href='/checkout'>
                                        <ShadcnBadge className="ml-2 text-xs rounded-full">
                                            {badgetext}
                                        </ShadcnBadge>
                                    </Link>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filter by</Label>
                <RadioGroup value={currentFilter} disabled>
                    {['today', 'week', 'newest', 'oldest', 'lifetime'].map((filter) => (
                        <div key={filter} className="flex items-center justify-between space-x-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={filter} id={filter} />
                                <Label htmlFor={filter}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Label>
                            </div>
                            <Link href='/login'>

                                <ShadcnBadge className="ml-2 text-xs rounded-full">
                                    {badgetext}
                                </ShadcnBadge>
                            </Link>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    </PopoverContent>
)

interface LoggedInSettingsPopoverProps {
    selectedSite: string
    setSelectedSite: (site: string) => void
    resultCount: number
    setResultCount: (count: number) => void
    currentFilter: string
    handleFilterChange: (filter: string) => void
    customUrl: string
    setCustomUrl: (url: string) => void
    membership: string
}

const LoggedInSettingsPopover: React.FC<LoggedInSettingsPopoverProps> = ({
    selectedSite,
    setSelectedSite,
    resultCount,
    setResultCount,
    currentFilter,
    handleFilterChange,
    customUrl,
    setCustomUrl,
    membership
}) => (
    <PopoverContent className="w-60 ml-5 shadow-none">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="site-select">Site</Label>
                <Select
                    value={selectedSite}
                    onValueChange={(value) => {
                        if (value === 'custom') {
                            // Keep 'custom' as the value when selecting "Custom Site"
                            setSelectedSite('custom');
                        } else {
                            setSelectedSite(value);
                        }
                    }}
                >
                    <SelectTrigger id="site-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map((site) => (
                            <SelectItem key={site.name} value={site.name}>
                                <div className="flex items-center">
                                    <Image src={site.icon} alt={site.name} width={16} height={16} className="mr-2" />
                                    {site.name}
                                </div>
                            </SelectItem>
                        ))}
                        <SelectItem
                            // disabled={ membership !== MEMBERSHIP_LEVELS.PRO } 
                            value="custom" className="border rounded-md">
                            <div className="flex items-center">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                <span>{customUrl || "Custom Site"}</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedSite === 'custom' && (
                <div className="space-y-2">
                    <Label htmlFor="custom-url">Custom URL</Label>
                    <div className="flex items-center">
                        <Input
                            id="custom-url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="Enter custom domain"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="ml-2"
                            onClick={() => {
                                if (customUrl) {
                                    setSelectedSite(customUrl)
                                    toast.success("Custom domain set")
                                } else {
                                    toast.error("Please enter a custom domain")
                                }
                            }}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="result-count">Result Count</Label>
                <Select
                    value={resultCount.toString()}
                    onValueChange={(value) => setResultCount(parseInt(value, 10))}
                >
                    <SelectTrigger id="result-count">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50].map((count) => (
                            <SelectItem key={count}
                                // disabled={count.toString()==='50'? membership !== MEMBERSHIP_LEVELS.PRO:false }
                                value={count.toString()}>
                                {count}
                            </SelectItem>
                        ))}
                        {/* <SelectItem value={} disabled={ membership === MEMBERSHIP_LEVELS.BASIC } >50</SelectItem> */}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filter by</Label>
                <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
                    {['today', 'week', 'newest', 'oldest', 'lifetime'].map((filter) => (
                        <div key={filter} className="flex items-center space-x-2">
                            <RadioGroupItem value={filter} id={filter} />
                            <Label htmlFor={filter}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    </PopoverContent>
)

interface SearchTabProps {
    Membership?: string
    name?: string
    email?: string
    userId?: string
    imageUrl?: string
}

export default function SearchTab({ Membership = '', name = '', email = '', userId = '', imageUrl = '' }: SearchTabProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentFilter, setCurrentFilter] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchData, setSearchData] = useState<Post[]>([])
    const [selectedSite, setSelectedSite] = useState('Reddit.com')
    const [resultCount, setResultCount] = useState<number>(10)
    const [customUrl, setCustomUrl] = useState('')
    const [credits, setCredits] = useState(0)
    const router = useRouter()

    useEffect(() => {
        if (!email) return

        const userDocRef = doc(db, 'users', email)
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const currentCredits = docSnapshot.data().credits
                setCredits(currentCredits)
            }
        })

        return () => unsubscribe()
    }, [email])

    useEffect(() => {
        if (searchData.length > 0) {
            setLoading(false)
        }
    }, [searchData])

    useEffect(() => {
        const cachedData = JSON.parse(localStorage.getItem(`searchData`) || '[]')
        setSearchData(cachedData)
        checkAndUpdateMembership(email)
    }, [email])

    const handleResultCountChange = (value: string) => {
        setResultCount(parseInt(value, 10))
    }

    const fetchResult = async (query: string): Promise<any[]> => {
        try {
            const response = await fetch('/api/searchApify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query, num: resultCount })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data = await response.json()

            if (data.success) {
                return data.data
            } else {
                throw new Error(data.error || 'Unknown API error occurred')
            }
        } catch (error: any) {
            console.error('Error fetching results:', error.message || error)
            return []
        }
    }

    const handleSearch = async () => {
        if (searchQuery.trim() !== '') {
            const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite

            setSearchData([])
            setLoading(true)

            try {
                const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter))
                const Results = await fetchResult(`site:${siteToSearch} ${searchQuery} ${dateFilterString} `)

                setSearchData(Results)
                localStorage.setItem('searchData', JSON.stringify(Results))
                localStorage.setItem('history', JSON.stringify({ title: searchQuery, data: Results }))

                if (userId) {
                    reduceUserCredit(email)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && searchQuery.trim() !== '') {
            handleSearch()
        }
    }

    const handleFilterChange = (value: string) => {
        setCurrentFilter(value)
        setIsFilterOpen(false)
    }

    const decodeUrl = (encodedUrl: string): string => decodeURIComponent(encodedUrl)

    const mapFilterToDate = (filter: string): DateFilter => {
        switch (filter) {
            case 'today': return DateFilter.Today
            case 'week': return DateFilter.Week
            case 'newest': return DateFilter.Latest
            case 'oldest': return DateFilter.Oldest
            case 'lifetime': return DateFilter.Lifetime
            default: return DateFilter.Lifetime
        }
    }

    const handleBookmark = async (post: Post) => {
        try {
            const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
            const updatedBookmarks = [...existingBookmarks, post]
            localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
            toast.success("Added to bookmarks", {
                description: `Bookmarked: ${post.title}`,
            })
        } catch (error) {
            console.error("Error adding bookmark:", error)
            toast.error("Failed to add bookmark", {
                description: "An error occurred while adding the bookmark.",
            })
        }
    }

    const handleLogout = async () => {
        await auth.signOut()
        Cookies.remove("token")
        window.location.reload()
    }

    const TabData: React.FC<{ platform: string; posts: Post[]; logo: string }> = ({ platform, posts, logo }) => {
        const handleEngage = (link: string) => {
            window.open(decodeUrl(link), '_blank')
        }

        const handleCopyUrl = (link: string) => {
            navigator.clipboard.writeText(decodeUrl(link))
                .then(() => {
                    toast("URL has been copied", {
                        action: {
                            label: "OK",
                            onClick: () => console.log("Undo"),
                        },
                    })
                })
                .catch((err) => {
                    console.error('Failed to copy: ', err)
                    toast("Failed to copy URL", {
                        description: "An error occurred while copying the URL.",
                    })
                })
        }

        return (
            <div className="container mx-auto py-6">
                {posts.length === 0 ? (
                    <div></div>
                ) : (
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                                <Image src={logo} alt={`${platform} Logo`} width={24} height={24} />
                                <h1 className="text-xl sm:text-2xl font-bold">{platform}</h1>
                            </div>
                            <span className="text-sm text-muted-foreground">{currentFilter}</span>
                        </div>
                        <SearchSummaryBot searchData={posts} searchQuery={searchQuery} />
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 mt-6">
                            {posts.map((post, index) => (

                                <Card key={index} className="flex shadow-none flex-col h-full">
                                    <ExpandableSearchResult
                                        key={index}
                                        post={post}
                                        onEngage={handleEngage}
                                        onBookmark={handleBookmark}
                                        onCopyUrl={handleCopyUrl}
                                    />
                                    {/* <CardHeader className="flex-grow">
                                        <CardTitle className="text-base font-medium leading-tight mb-2 text-blue-600">
                                            <a
                                                href={decodeURIComponent(post.link)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline line-clamp-2"
                                            >
                                                {post.title}
                                            </a>
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{post.snippet}</p>
                                    </CardHeader>
                                    <CardFooter className="flex justify-between items-center">
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full"
                                                onClick={() => handleEngage(post.link)}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="sr-only">Engage</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full"
                                                onClick={() => handleCopyUrl(post.link)}
                                            >
                                                <Link2 className="w-4 h-4" />
                                                <span className="sr-only">Copy URL</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full"
                                                onClick={() => handleBookmark(post)}
                                            >
                                                <Bookmark className="w-4 h-4" />
                                                <span className="sr-only">Save</span>
                                            </Button>
                                        </div>
                                    </CardFooter> */}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-background">
            <Toaster position="bottom-center" />
            <header className="w-full py-4 px-6 flex justify-between items-center bg-background border-none">
                <div className="flex items-center">
                    <Image src="/logo.svg" alt="Logo" width={32} height={32} />
                    <h1 className="ml-2 text-xl font-bold hidden sm:block">Search</h1>
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
                                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full" align="end" forceMount>
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={imageUrl || "/placeholder.svg?height=48&width=48"} alt={name} />
                                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-5 border-t">
                                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
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
            <div className="w-full max-w-3xl mx-auto px-3 py-8">
                <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-6">
                    What can I help you find?
                </h1>
                {/* {Membership === MEMBERSHIP_LEVELS.FREE && (
                    <div className="mb-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-none bg-primary">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center">
                                <p className="text-xs sm:text-sm text-foreground mr-1">
                                    <a href="/checkout">
                                        Upgrade now to find your perfect audience

                                    </a>
                                </p>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1 ml-2 sm:ml-1">
                                <Button
                                    variant="link"
                                    className="text-emerald-600 underline hover:text-emerald-300 p-0 h-auto font-normal text-xs sm:text-sm whitespace-nowrap"
                                    onClick={() => router.push(`/checkout`)}
                                >
                                    Upgrade Plan
                                </Button>
                            </div>
                        </div>
                    </div>
                )} */}

                <div className="w-full border border-gray-300 rounded-xl p-2">
                    <div className="flex-grow relative mb-4">
                        <Input
                            onKeyDown={handleKeyDown}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Let's find people..."
                            className="h-full border-none font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-9 h-9 rounded-[6px] hover:bg-gray-700 hover:text-white"
                                    >
                                        <Settings2 className="w-4 h-4 md:w-5 md:h-5 shadow-none" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </PopoverTrigger>
                                {/* {userId ? (
                                    // Membership === MEMBERSHIP_LEVELS.PRO ?
                                    //     <LoggedOutSettingsPopover
                                    //         selectedSite={selectedSite}
                                    //         badgetext='upgrade'
                                    //         setSelectedSite={setSelectedSite}
                                    //         resultCount={resultCount}
                                    //         currentFilter={currentFilter}
                                    //         onValueChange={handleResultCountChange}
                                    //     /> :
                                    <LoggedInSettingsPopover
                                        selectedSite={selectedSite}
                                        setSelectedSite={setSelectedSite}
                                        resultCount={resultCount}
                                        setResultCount={setResultCount}
                                        currentFilter={currentFilter}
                                        handleFilterChange={handleFilterChange}
                                        customUrl={customUrl}
                                        setCustomUrl={setCustomUrl}
                                        membership={Membership}
                                    />
                                ) : (
                                    <LoggedOutSettingsPopover
                                        selectedSite={selectedSite}
                                        badgetext='upgrade'
                                        setSelectedSite={setSelectedSite}
                                        resultCount={resultCount}
                                        currentFilter={currentFilter}
                                        onValueChange={handleResultCountChange}
                                    />
                                )} */}

                                <LoggedInSettingsPopover
                                    selectedSite={selectedSite}
                                    setSelectedSite={setSelectedSite}
                                    resultCount={resultCount}
                                    setResultCount={setResultCount}
                                    currentFilter={currentFilter}
                                    handleFilterChange={handleFilterChange}
                                    customUrl={customUrl}
                                    setCustomUrl={setCustomUrl}
                                    membership={Membership}
                                />
                            </Popover>

                            <Badge size="1" color="crimson"  >
                                {selectedSite === 'custom' ? (customUrl || 'Custom Site') : selectedSite}
                            </Badge>
                            {currentFilter && (
                                <Badge size="1" color="orange" >
                                    {mapFilterToDate(currentFilter).replace('last', '')}
                                </Badge>
                            )}
                            <Badge color="cyan" variant="soft">{resultCount}</Badge>
                        </div>

                        <Button
                            onClick={handleSearch}
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-full  text-white bg-gray-700  hover:bg-gray-800 hover:text-white"
                        >
                            <Search className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="sr-only">Search</span>
                        </Button>
                    </div>
                </div>

                <div className="flex mt-3 flex-wrap gap-2 justify-center">
                    <Button
                        variant="outline"
                        className="group text-[9px] font-bold h-4 px-2 rounded-full border shadow-none"
                        onClick={() => setSearchQuery("Biggest frustrations with [product/competitor]")}
                    >
                        frustrations with [product/competitor]
                        <ArrowUp className="h-2 w-2 rotate-45 ml-1" />
                    </Button>
                    <Button
                        variant="outline"
                        className="group text-[9px] font-bold h-4 px-2 rounded-full border shadow-none"
                        onClick={() => setSearchQuery("Do [target market] need [product idea]?")}
                    >
                        Do [target market] need [product idea]?
                        <ArrowUp className="h-2 w-2 rotate-45 ml-1" />
                    </Button>
                </div>

                {loading && (<TabDataSkeleton />)}
                <TabData
                    platform={selectedSite === 'custom' ? customUrl : selectedSite}
                    posts={searchData}
                    logo={selectedSite === 'custom' ? '/custom.png' : sites.find(site => site.name === selectedSite)?.icon || '/custom.png'}
                />
            </div>
        </main>
    )
}

function getDateFilterString(dateFilter: DateFilter): string {
    const today = new Date()

    const formatDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const twoMonthsAgo = new Date(today)
    twoMonthsAgo.setMonth(today.getMonth() - 2)

    const twoYearsAgo = new Date(today)
    twoYearsAgo.setFullYear(today.getFullYear() - 2)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)

    const todayStr = formatDate(today)
    const twoMonthsAgoStr = formatDate(twoMonthsAgo)
    const twoYearsAgoStr = formatDate(twoYearsAgo)
    const yesterdayStr = formatDate(yesterday)
    const oneWeekAgoStr = formatDate(oneWeekAgo)

    switch (dateFilter) {
        case DateFilter.Today:
            return `after:${yesterdayStr} before:${todayStr}`
        case DateFilter.Week:
            return `after:${oneWeekAgoStr} before:${todayStr}`
        case DateFilter.Latest:
            return `after:${twoMonthsAgoStr} before:${todayStr}`
        case DateFilter.Oldest:
            return `after:${twoYearsAgoStr} before:${todayStr}`
        case DateFilter.Lifetime:
            return ''
        default:
            return ''
    }
}