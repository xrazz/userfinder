'use client'

import React, { useState, useEffect } from 'react'
import { Search, MessageSquare, Link as LinkIcon, Trash, Bookmark, Link2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"

interface Bookmark {
  title: string
  link: string
  snippet: string
}

export default function BookmarkPlotter() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const storedBookmarks = localStorage.getItem('bookmarks')
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks))
    }
  }, [])

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.snippet.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className='w-full max-w-3xl mx-auto px-3 py-8'>
      <div className="container mx-auto p-4 space-y-6">
        <Toaster position="top-center" />
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center mb-2">
            Bookmarked Results
          </h1>

          <p className="text-muted-foreground">Manage and search your saved bookmarks</p>
        </header>
        <div className="relative max-w-full mx-auto">
          <Input
            type="text"
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-700 focus:ring-0 focus:border-gray-700"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        </div>
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 mt-8">

            <img src="/bookmarks.svg" width={250} height={250} alt="bookmarks" className="max-w-full h-auto" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {filteredBookmarks.map((bookmark, index) => (
              <Card key={index} className="flex shadow-none flex-col h-full">
                <CardHeader className="flex-grow">
                  <CardTitle className="text-base font-medium leading-tight mb-2 text-blue-600">
                    <a
                      href={decodeURIComponent(bookmark.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline line-clamp-2"
                    >
                      {bookmark.title}
                    </a>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{bookmark.snippet}</p>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => handleEngage(bookmark.link)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="sr-only">Engage</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => handleCopyUrl(bookmark.link)}
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="sr-only">Copy URL</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
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
        )}
      </div>
    </div>
  )
}