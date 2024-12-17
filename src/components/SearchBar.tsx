import React, { useRef, useState } from 'react'
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, typingQuery, setTypingQuery }) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

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

    return (
        <div className={`w-full border rounded-xl overflow-hidden transition-all duration-300 ${
            isSearchFocused ? 'border-primary shadow-lg' : 'border-gray-200 dark:border-gray-800'
        }`}>
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
                    placeholder="Let's find..."
                    className="h-12 px-4 border-none font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                />
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