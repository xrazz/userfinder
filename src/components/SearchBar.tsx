import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
}

const placeholderQueries = [
    "Let's find your next inspiration...",
    "Let's find groundbreaking discoveries...",
    "Let's find innovative solutions...",
    "Let's find expert insights...",
    "Let's find cutting-edge research...",
    "Let's find hidden knowledge..."
]

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, typingQuery, setTypingQuery }) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [currentPlaceholder, setCurrentPlaceholder] = useState('')
    const [isTyping, setIsTyping] = useState(true)

    useEffect(() => {
        let currentText = placeholderQueries[placeholderIndex]
        let currentIndex = 0
        let typingInterval: NodeJS.Timeout
        let deletingTimeout: NodeJS.Timeout

        if (isTyping) {
            typingInterval = setInterval(() => {
                if (currentIndex <= currentText.length) {
                    setCurrentPlaceholder(currentText.slice(0, currentIndex))
                    currentIndex++
                } else {
                    clearInterval(typingInterval)
                    deletingTimeout = setTimeout(() => {
                        const deleteInterval = setInterval(() => {
                            setCurrentPlaceholder(prev => {
                                if (prev.length <= 0) {
                                    clearInterval(deleteInterval)
                                    setIsTyping(true)
                                    setPlaceholderIndex(prevIndex => (prevIndex + 1) % placeholderQueries.length)
                                    return ''
                                }
                                return prev.slice(0, -1)
                            })
                        }, 50)
                    }, 1000)
                }
            }, 100)
        }

        return () => {
            clearInterval(typingInterval)
            clearTimeout(deletingTimeout)
        }
    }, [placeholderIndex, isTyping])

    const generateSuggestions = async (query: string) => {
        if (!query.trim()) {
            setSuggestions([])
            return
        }

        try {
            const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`)
            const data = await response.json()
            setSuggestions(data.suggestions)
        } catch (error) {
            console.error('Error fetching suggestions:', error)
            setSuggestions([])
        }
    }

    const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout
        return (...args: any[]) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }

    const debouncedGenerateSuggestions = debounce(generateSuggestions, 300)

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setTypingQuery(value)
        debouncedGenerateSuggestions(value)
    }

    const handleSuggestionClick = (suggestion: string) => {
        setTypingQuery(suggestion)
        setShowSuggestions(false)
        onSearch(suggestion)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && typingQuery.trim() !== '') {
            onSearch(typingQuery)
        }
    }

    const handleSearch = () => {
        if (typingQuery.trim() !== '') {
            onSearch(typingQuery)
        }
    }

    return (
        <div className={`w-full border rounded-xl overflow-hidden transition-all duration-300 ${
            isSearchFocused ? 'border-primary shadow-lg' : 'border-gray-200 dark:border-gray-800'
        }`}>
            <div className="flex items-center">
                <div className="flex-grow relative">
                    <Input
                        ref={searchInputRef}
                        onKeyDown={handleKeyDown}
                        value={typingQuery}
                        onChange={handleSearchInputChange}
                        onFocus={() => {
                            setIsSearchFocused(true)
                            setShowSuggestions(true)
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                setIsSearchFocused(false)
                                setShowSuggestions(false)
                            }, 200)
                        }}
                        placeholder={currentPlaceholder}
                        className="h-12 px-4 border-none font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-xl transition-colors duration-200"
                >
                    <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-50"
                    >
                        {suggestions.map((suggestion, index) => (
                            <motion.div
                                key={suggestion}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <Search className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{suggestion}</span>
                                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-400" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

