"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { MessageSquare, LinkIcon, Trash, Loader2 } from 'lucide-react'
import { toast, Toaster } from "sonner"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
 
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'

interface Bookmark {
  title: string
  url: string
  createdAt: Date
}

const decodeUrl = (encodedUrl: string): string => {
  return decodeURIComponent(encodedUrl);
};

const BookmarksTab = ({ userId }: { userId: string }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const cachedBookmarks = localStorage.getItem(`bookmarks-${userId}`);
    
    if (cachedBookmarks) {
      setBookmarks(JSON.parse(cachedBookmarks));
      setLoading(false);
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const updatedBookmarks = (userData.bookmarks || []).reverse();

        // If the data is different, update both the state and local storage
        const cachedData = JSON.parse(localStorage.getItem(`bookmarks-${userId}`) || '[]');
        if (JSON.stringify(cachedData) !== JSON.stringify(updatedBookmarks)) {
          setBookmarks(updatedBookmarks);
          localStorage.setItem(`bookmarks-${userId}`, JSON.stringify(updatedBookmarks));
        }
      } else {
        console.log('No such document!');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching bookmarks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId])

  const handleEngage = (link: string) => {
    window.open(decodeUrl(link), '_blank')
  }

  const handleCopyUrl = (link: string) => {
    navigator.clipboard.writeText(decodeUrl(link)).then(() => {
      console.log("The URL is copied")
      toast.success("URL has been copied", {
        description: `Copied: ${link}`,
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      })
    }).catch((err) => {
      console.error('Failed to copy: ', err)
      toast.error("Failed to copy URL", {
        description: "An error occurred while copying the URL.",
      })
    })
  }
  
  

  const handleRemoveBookmark = async (bookmark: Bookmark) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        bookmarks: arrayRemove(bookmark)
      })
      toast.success("Removed from bookmarks", {
        description: `Removed: ${bookmark.title}`,
      })
    } catch (error) {
      console.error("Error removing bookmark:", error)
      toast.error("Failed to remove bookmark", {
        description: "An error occurred while removing the bookmark.",
      })
    }
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    switch (activeTab) {
      case "reddit":
        return bookmark.url.includes("reddit.com")
      case "x":
        return bookmark.url.includes("x.com") || bookmark.url.includes("twitter.com")
      case "quora":
        return bookmark.url.includes("quora.com")
      case "ycombinator":
        return bookmark.url.includes("ycombinator.com") || bookmark.url.includes("news.ycombinator.com")
      case "dev":
        return bookmark.url.includes("dev.to")  
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="mt-4 text-lg font-semibold text-gray-700">Fetching bookmarks...</span>
      </div>
    )
  }

  return (
    <main className="flex-grow flex items-start justify-center p-4">
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
      linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px) 
    `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)'
        }}
      />
      <Toaster position="top-center" />
      <div className='w-full max-w-3xl mx-auto space-y-8'>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Your Bookmarks</h1>
        </div>

        <div className="flex justify-center">
          <nav className="flex space-x-2 rounded-lg bg-gray-100 p-1">
            {["all", "reddit", "x", "quora", "ycombinator","dev"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out ${
                  activeTab === tab
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "x" ? "X" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <BookmarkList 
          bookmarks={filteredBookmarks} 
          handleEngage={handleEngage} 
          handleCopyUrl={handleCopyUrl} 
          handleRemoveBookmark={handleRemoveBookmark} 
        />
      </div>
    </main>
  )
}

const BookmarkList = ({ 
  bookmarks, 
  handleEngage, 
  handleCopyUrl, 
  handleRemoveBookmark 
}: { 
  bookmarks: Bookmark[], 
  handleEngage: (link: string) => void, 
  handleCopyUrl: (link: string) => void, 
  handleRemoveBookmark: (bookmark: Bookmark) => Promise<void> 
}) => {
  if (bookmarks.length === 0) {
    return (
      <Alert>
        <AlertTitle>No bookmarks in this category</AlertTitle>
        <AlertDescription>
          Save some posts from your searches to see them here!
        </AlertDescription>
      </Alert>
    )
  }

  const getLogoSrc = (url: string) => {
    if (url.includes("reddit.com")) return "/reddit.svg"
    if (url.includes("dev.to")) return "/dev.svg"
    if (url.includes("x.com") || url.includes("twitter.com")) return "/twitter.svg"
    if (url.includes("quora.com")) return "/quora.svg"
    if (url.includes("ycombinator.com") || url.includes("news.ycombinator.com")) return "/y-combinator.svg"
    return "/default-bookmark.svg"
  }

  return (
    <div className="space-y-6">
      {bookmarks.map((bookmark, index) => (
        <React.Fragment key={index}>
          <div className="py-4">
            <div className="flex items-start space-x-3">
              <Image
                src={getLogoSrc(bookmark.url)}
                alt="Bookmark Icon"
                width={20}
                height={20}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-600">Bookmark</span>
                  {/* <span className="text-sm text-gray-400">
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span> */}
                </div>
                <h2 className="text-lg font-semibold mt-1">
                  <a href={decodeUrl(bookmark.url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {bookmark.title}
                  </a>
                </h2>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-blue-600 hover:border-blue-600" onClick={() => handleEngage(bookmark.url)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Engage
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-green-600 hover:border-green-600" onClick={() => handleCopyUrl(bookmark.url)}>
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-red-600 hover:border-red-600" onClick={() => handleRemoveBookmark(bookmark)}>
                      <Trash className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {index < bookmarks.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default BookmarksTab