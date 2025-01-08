'use client'

import React, { useEffect, useState } from 'react'
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, SparklesIcon } from "lucide-react"
import { Card } from '@/components/ui/card'

interface SearchQuery {
    id: string
    query: string
    timestamp: Timestamp
    platform: string
    filter?: string
}

const getDateFromTimestamp = (timestamp: any): Date => {
    try {
        // Handle Firestore Timestamp objects
        if (timestamp?.toDate) {
            return timestamp.toDate();
        }
        
        // Handle raw Firestore timestamp data
        if (timestamp?.seconds) {
            return new Date(timestamp.seconds * 1000);
        }
        
        // Handle Date objects
        if (timestamp instanceof Date) {
            return timestamp;
        }
        
        // Handle ISO string timestamps
        if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Handle numeric timestamps (milliseconds)
        if (typeof timestamp === 'number') {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        throw new Error('Invalid timestamp format');
    } catch (error) {
        console.error('Error parsing timestamp:', error, timestamp);
        throw new Error('Failed to parse timestamp');
    }
}

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC'
    }).format(date);
}

const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    }).format(date);
}

export default function AdminPage() {
    const [queries, setQueries] = useState<SearchQuery[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [platformFilter, setPlatformFilter] = useState('all')
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
        from: null,
        to: null,
    })
    const [aiAnalysis, setAiAnalysis] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const auth = getAuth()
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user?.email === 'cartin.denis@gmail.com' || user?.email === 'rajtripathi2580@gmail.com') {
                setAuthorized(true)
                fetchQueries()
            } else {
                setAuthorized(false)
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    const fetchQueries = async () => {
        try {
            const queryRef = query(
                collection(db, 'generalSearchHistory'),
                orderBy('timestamp', 'desc')
            )
            const querySnapshot = await getDocs(queryRef)
            const queriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as SearchQuery[]
            setQueries(queriesData)
        } catch (error) {
            console.error('Error fetching queries:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.query.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPlatform = platformFilter === 'all' || q.platform === platformFilter
        const queryDate = getDateFromTimestamp(q.timestamp)
        const matchesDateRange = (!dateRange.from || queryDate >= dateRange.from) &&
            (!dateRange.to || queryDate <= dateRange.to)
        return matchesSearch && matchesPlatform && matchesDateRange
    })

    const generateAiAnalysis = async () => {
        setIsAnalyzing(true)
        try {
            const response = await fetch('/api/admin/analyze-queries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    queries: filteredQueries.map(q => ({
                        query: q.query,
                        timestamp: getDateFromTimestamp(q.timestamp),
                        platform: q.platform,
                    })),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to analyze queries')
            }

            const data = await response.json()
            setAiAnalysis(data.analysis)
        } catch (error) {
            console.error('Error analyzing queries:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const uniquePlatforms = Array.from(new Set(queries.map(q => q.platform)))

    if (loading) {
        return (
            <div className="container mx-auto py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!authorized) {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold text-center text-red-600">
                    Access Denied
                </h1>
                <p className="text-center mt-4">
                    You are not authorized to view this page.
                </p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Search Queries Analytics</h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Input
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        {uniquePlatforms.map(platform => (
                            <SelectItem key={platform} value={platform}>
                                {platform}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from ?? undefined}
                            selected={{
                                from: dateRange.from ?? undefined,
                                to: dateRange.to ?? undefined,
                            }}
                            onSelect={(range: any) => setDateRange(range)}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                <Button 
                    onClick={generateAiAnalysis}
                    disabled={isAnalyzing}
                    className="w-full"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="mr-2 h-4 w-4" />
                            Analyze Trends
                        </>
                    )}
                </Button>
            </div>

            {/* AI Analysis Card */}
            {aiAnalysis && (
                <Card className="p-6 mb-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-4">
                        <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                            AI Analysis
                        </h2>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                        {aiAnalysis.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                    </div>
                </Card>
            )}

            {/* Queries Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Query</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Filter</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredQueries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    No queries found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQueries.map((query) => (
                                <TableRow key={query.id}>
                                    <TableCell className="font-medium">{query.query}</TableCell>
                                    <TableCell>{query.platform}</TableCell>
                                    <TableCell>
                                        {formatDate(getDateFromTimestamp(query.timestamp))}
                                    </TableCell>
                                    <TableCell>
                                        {formatTime(getDateFromTimestamp(query.timestamp))}
                                    </TableCell>
                                    <TableCell>{query.filter || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 