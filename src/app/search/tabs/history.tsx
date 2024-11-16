'use client'

import React, { useState, useEffect } from 'react'
import { Search, ExternalLink, Trash, ChevronDown } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  title: string
  link: string
  snippet: string
}

interface HistoryItem {
  title: string
  data: SearchResult[]
}

export default function SearchHistoryPlotter() {
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const storedHistory = localStorage.getItem('history')
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory)
        setSearchHistory(Array.isArray(parsedHistory) ? parsedHistory : [parsedHistory])
      } catch (error) {
        console.error('Error parsing history from localStorage:', error)
        toast.error("Failed to load search history", {
          description: "An error occurred while loading your search history.",
        })
      }
    }
  }, [])

  const filteredHistory = searchHistory.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.data.some(result => 
      result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.snippet.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleDelete = (itemToDelete: HistoryItem) => {
    const updatedHistory = searchHistory.filter(item => item.title !== itemToDelete.title)
    setSearchHistory(updatedHistory)
    localStorage.setItem('history', JSON.stringify(updatedHistory))
    toast.success("Search history item deleted", {
      description: `Deleted: ${itemToDelete.title}`,
    })
  }

  return (
    <div className='w-full max-w-3xl mx-auto px-3 py-8'>
    <div className="container mx-auto p-4 w-full">
      <Toaster position="top-center" />
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center mb-3">
            Search History
          </h1>
          <p className="text-center mb-5 text-muted-foreground">Manage and search your recent search history</p>
      <div className="mb-6 relative">
        <Input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 "
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>
      {searchHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 mt-8">
          <img src="/bookmarks.svg?height=350&width=350" alt="No search history" width={350} height={350} />
          <p className="text-xl font-semibold text-gray-600">No search history yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((historyItem, index) => (
            <Card key={index} className="w-full border border-gray-200 shadow-none hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">{historyItem.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{historyItem.data.length} results</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(historyItem)}
                    className="text-gray-500 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash className="w-4 h-4" />
                    <span className="sr-only">Delete search history item</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="results" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200">View Results</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-4 mt-2">
                        {historyItem.data.map((result, resultIndex) => (
                          <li key={resultIndex} className="w-full bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                            <h3 className="font-semibold mb-2">
                              <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center transition-colors duration-200">
                                {result.title}
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}