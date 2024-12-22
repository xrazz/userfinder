import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, Settings2, FileText } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
    className?: string
    showSettings?: boolean
    onSettingsClick?: () => void
}

const placeholderQueries = [
    "Let's find your next inspiration...",
    "Let's find groundbreaking discoveries...",
    "Let's find innovative solutions...",
    "Let's find expert insights...",
    "Let's find cutting-edge research...",
    "Let's find hidden knowledge..."
]

// Definizione più precisa dei tipi di file con i relativi dork
const fileTypes = [
    { value: "all", label: "All Files", dork: "" },
    { value: "pdf", label: "PDF Documents", dork: "filetype:pdf" },
    { value: "doc", label: "Word Documents", dork: "(filetype:doc OR filetype:docx)" },
    { value: "xls", label: "Excel Spreadsheets", dork: "(filetype:xls OR filetype:xlsx)" },
    { value: "ppt", label: "PowerPoint", dork: "(filetype:ppt OR filetype:pptx)" },
    { value: "txt", label: "Text Files", dork: "filetype:txt" },
    { value: "csv", label: "CSV Files", dork: "filetype:csv" },
    { value: "json", label: "JSON Files", dork: "filetype:json" },
    { value: "xml", label: "XML Files", dork: "filetype:xml" },
    { value: "sql", label: "SQL Files", dork: "filetype:sql" },
    { value: "zip", label: "Archives", dork: "(filetype:zip OR filetype:rar)" }
]

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    typingQuery, 
    setTypingQuery, 
    className = '', 
    showSettings = false, 
    onSettingsClick 
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [currentPlaceholder, setCurrentPlaceholder] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [selectedFileType, setSelectedFileType] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Effetto per l'animazione del placeholder
    useEffect(() => {
        const text = placeholderQueries[placeholderIndex]
        let index = 0
        let typingInterval: NodeJS.Timeout
        
        if (isTyping) {
            typingInterval = setInterval(() => {
                if (index <= text.length) {
                    setCurrentPlaceholder(text.slice(0, index))
                    index++
                } else {
                    clearInterval(typingInterval)
                    setTimeout(() => {
                        setIsTyping(false)
                        setTimeout(() => {
                            setIsTyping(true)
                            setPlaceholderIndex((prev) => (prev + 1) % placeholderQueries.length)
                        }, 2000)
                    }, 1000)
                }
            }, 100)
        }

        return () => clearInterval(typingInterval)
    }, [placeholderIndex, isTyping])

    // Funzione per costruire la query di ricerca
    const buildSearchQuery = (term: string, fileType: string): string => {
        // Se c'è già un filetype: nella query, non modificarla
        if (term.toLowerCase().includes('filetype:')) {
            return term.trim();
        }
        
        // Trova il dork corrispondente al tipo di file selezionato
        const selectedType = fileTypes.find(t => t.value === fileType);
        const dork = selectedType?.dork || '';
        
        // Se c'è un dork, aggiungilo alla query
        return dork ? `${term.trim()} ${dork}` : term.trim();
    }

    // Gestione delle suggestions
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

    const debouncedGenerateSuggestions = React.useCallback(
        debounce((query: string) => generateSuggestions(query), 300),
        []
    )

    // Handlers
    const handleSearch = () => {
        if (!searchTerm.trim()) return
        
        const finalQuery = buildSearchQuery(searchTerm, selectedFileType)
        console.log('Final search query:', finalQuery) // Debug log
        onSearch(finalQuery)
        setShowSuggestions(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        setTypingQuery(value)
        debouncedGenerateSuggestions(value)
    }

    const handleFileTypeChange = (value: string) => {
        setSelectedFileType(value)

        if (searchTerm.trim()) {
            const finalQuery = buildSearchQuery(searchTerm, value)
            onSearch(finalQuery)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            handleSearch()
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion)
        setTypingQuery(suggestion)
        setShowSuggestions(false)
        // Esegui la ricerca immediatamente con la suggestion
        const finalQuery = buildSearchQuery(suggestion, selectedFileType)
        onSearch(finalQuery)
    }

    return (
        <div className={`w-full border rounded-xl overflow-hidden transition-all duration-300 bg-white/50 dark:bg-gray-900 ${
            isSearchFocused ? 'border-primary shadow-lg' : 'border-gray-200 dark:border-gray-800'
        } ${className}`}>
            <div className="flex items-center h-full">
                <div className="flex-grow relative flex items-center">
                    <Input
                        ref={searchInputRef}
                        value={searchTerm}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
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
                <div className="flex items-stretch h-full divide-x divide-gray-200 dark:divide-gray-800">
                    <div className="px-2 flex items-center">
                        <Select value={selectedFileType} onValueChange={handleFileTypeChange}>
                            <SelectTrigger className="w-40 border-0 bg-transparent focus:ring-0">
                                <SelectValue placeholder="All Files" />
                            </SelectTrigger>
                            <SelectContent>
                                {fileTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            {type.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                    >
                        <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    {showSettings && (
                        <button
                            onClick={onSettingsClick}
                            className="px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Settings2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                </div>
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
                                className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div 
                                    className="flex-1 flex items-center cursor-pointer"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <Search className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{suggestion}</span>
                                </div>
                                <button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Utility function for debouncing
function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}