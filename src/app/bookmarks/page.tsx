'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Link2, Trash, LogOut, SparklesIcon, ExternalLink } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ExpandableSearchResult from '../llm/ExpandableSearchResult'
import { doc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { Badge } from "@/components/ui/badge"
import { Bookmark } from 'lucide-react'
import { auth } from '@/app/firebaseClient'
import { onAuthStateChanged } from 'firebase/auth'


interface Bookmark {
  title: string
  link: string
  snippet: string
}

interface SavedResponse {
  id: string
  content: string
  timestamp: number
  topics: string[]
  query: string
  results?: {
    title: string
    link: string
    snippet: string
  }[]
}

const MAX_CONTENT_LENGTH = 300;

const formatTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and wrap the content in strong tags
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const ExpandableContent = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowButton = content.length > MAX_CONTENT_LENGTH;
  const displayContent = isExpanded ? content : content.slice(0, MAX_CONTENT_LENGTH);

  return (
    <div className="space-y-2">
      <div className="prose dark:prose-invert max-w-none text-sm">
        {formatTextWithBold(displayContent)}
        {!isExpanded && shouldShowButton && "..."}
      </div>
      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
};

const SavedResponseCard = ({ response, onDelete }: { response: SavedResponse, onDelete: (response: SavedResponse) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleSearchAgain = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking search again
    router.push(`/?q=${encodeURIComponent(response.query)}`);
  };

  return (
    <Card className="flex shadow-sm hover:shadow-md transition-shadow duration-200 flex-col">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className="text-sm font-medium">AI Response</div>
              <div className="text-xs text-muted-foreground">
                {new Date(response.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(response)}
            >
              <Trash className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>

        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{response.query}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSearchAgain}
              className="text-xs"
            >
              Search again
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              {isExpanded ? "Reduce" : "Expand"}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="space-y-3">
              <div className="prose dark:prose-invert max-w-none text-sm">
                {formatTextWithBold(response.content)}
              </div>
              {response.topics && response.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {response.topics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {response.results && response.results.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    Related Sources
                  </div>
                  <div className="grid gap-2">
                    {response.results.map((result, idx) => (
                      <a
                        key={idx}
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-2 group"
                      >
                        <span className="min-w-[1.5rem]">{idx + 1}.</span>
                        <span className="line-clamp-1 flex-1">{result.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardHeader>
    </Card>
  );
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'ai'>('ai')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email)
      } else {
        setUserEmail(null)
        router.push('/login') // Redirect to login if not authenticated
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    // Load regular bookmarks from localStorage
    const storedBookmarks = localStorage.getItem('bookmarks')
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks))
    }

    // Load AI responses from Firestore
    const loadSavedResponses = async () => {
      if (!userEmail) return

      try {
        const userDocRef = doc(db, 'users', userEmail)
        const savedResponsesRef = collection(userDocRef, 'savedResponses')
        const savedResponsesSnap = await getDocs(savedResponsesRef)
        
        // Only map and set responses if there are actual documents
        const responses = savedResponsesSnap.docs
          .filter(doc => {
            const data = doc.data()
            // Check if the document has the required fields and they're not empty
            return data.content && data.query && data.timestamp
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as SavedResponse[]
          
        setSavedResponses(responses)
      } catch (error) {
        console.error('Error loading saved responses:', error)
        toast.error("Failed to load saved responses")
      }
    }

    if (userEmail) {
      loadSavedResponses()
    }
  }, [userEmail]) // Reload when userEmail changes

  const filteredBookmarks = bookmarks.filter(bookmark =>
    (bookmark?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (bookmark?.snippet?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const filteredResponses = savedResponses.filter(response =>
    (response?.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (response?.query?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const handleEngage = (link: string) => {
    window.open(link, '_blank')
  }

  const handleCopyUrl = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success("URL copied to clipboard", {
        description: `Copied: ${link}`,
      })
    }).catch((err) => {
      console.error('Failed to copy: ', err)
      toast.error("Failed to copy URL", {
        description: "An error occurred while copying the URL.",
      })
    })
  }

  const handleDelete = (bookmarkToDelete: Bookmark) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.link !== bookmarkToDelete.link)
    setBookmarks(updatedBookmarks)
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
    toast.success("Bookmark deleted", {
      description: `Deleted: ${bookmarkToDelete.title}`,
    })
  }

  const handleDeleteResponse = async (responseToDelete: SavedResponse) => {
    if (!userEmail) return

    try {
      const userDocRef = doc(db, 'users', userEmail)
      const savedResponsesRef = collection(userDocRef, 'savedResponses')
      const q = query(savedResponsesRef, where('id', '==', responseToDelete.id))
      const querySnapshot = await getDocs(q)
      
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref)
      })

      setSavedResponses(prev => prev.filter(response => response.id !== responseToDelete.id))
      toast.success("Response deleted", {
        description: `Deleted response for query: ${responseToDelete.query}`,
      })
    } catch (error) {
      console.error('Error deleting response:', error)
      toast.error("Failed to delete response")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="bottom-center" />
      <header className="w-full py-4 px-6 flex justify-between items-center bg-background border-b">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <div>
            <h1 className="text-xl font-semibold hidden sm:block">Library</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Your saved items and AI responses</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Go to Search</span>
          </Button>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex justify-center gap-4">
            <Button
              variant={activeTab === 'ai' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ai')}
              className="gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              AI Responses
            </Button>
            <Button
              variant={activeTab === 'bookmarks' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bookmarks')}
              className="gap-2"
            >
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </Button>
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder={activeTab === 'ai' ? "Search saved responses..." : "Search bookmarks..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>

          {activeTab === 'bookmarks' ? (
            bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 mt-12 py-8">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Bookmark className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">No bookmarks yet</p>
                  <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
                    <Search className="w-4 h-4" />
                    Start searching
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {filteredBookmarks.map((bookmark, index) => (
                  <Card key={index} className="flex shadow-sm hover:shadow-md transition-shadow duration-200 flex-col h-full">
                    <CardHeader className="flex-grow">
                      <CardTitle className="text-base font-medium leading-tight mb-2">
                        <a
                          href={decodeURIComponent(bookmark.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-2"
                        >
                          {bookmark.title}
                        </a>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{bookmark.snippet}</p>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleCopyUrl(bookmark.link)}
                        >
                          <Link2 className="w-4 h-4" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(bookmark)}
                        >
                          <Trash className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          ) : (
            savedResponses.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 mt-12 py-8">
                <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <SparklesIcon className="w-10 h-10 text-purple-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">No AI responses saved yet</p>
                  <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
                    <Search className="w-4 h-4" />
                    Start searching
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredResponses.map((response, index) => (
                  <SavedResponseCard 
                    key={index} 
                    response={response} 
                    onDelete={handleDeleteResponse}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  )
}