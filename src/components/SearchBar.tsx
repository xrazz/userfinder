import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, Settings2, FileText, FileType, FileSpreadsheet, Presentation, FileJson, FileCode, Archive, ChevronDown } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
    className?: string
    showSettings?: boolean
    onSettingsClick?: () => void
    onFileTypeChange: (value: string) => void
    selectedFileType: string
    fileTypes: Array<{ value: string, label: string, dork: string }>
}

const placeholderQueries = [
    "Let's find your next inspiration...",
    "Let's find groundbreaking discoveries...",
    "Let's find innovative solutions...",
    "Let's find expert insights...",
    "Let's find cutting-edge research...",
    "Let's find hidden knowledge..."
]

// Aggiungi un componente per l'icona del file type
const FileTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'pdf':
            return <FileText className="w-4 h-4 text-red-500" />
        case 'doc':
            return <FileType className="w-4 h-4 text-blue-500" />
        case 'xls':
            return <FileSpreadsheet className="w-4 h-4 text-green-500" />
        case 'ppt':
            return <Presentation className="w-4 h-4 text-orange-500" />
        case 'txt':
            return <FileText className="w-4 h-4 text-gray-500" />
        case 'csv':
            return <FileSpreadsheet className="w-4 h-4 text-green-400" />
        case 'json':
            return <FileJson className="w-4 h-4 text-yellow-500" />
        case 'xml':
            return <FileCode className="w-4 h-4 text-purple-500" />
        case 'sql':
            return <FileCode className="w-4 h-4 text-blue-400" />
        case 'zip':
            return <Archive className="w-4 h-4 text-gray-500" />
        default:
            return <FileText className="w-4 h-4 text-gray-400" />
    }
}

// Aggiungi questa funzione helper per ottenere il label del file type
const getFileTypeLabel = (type: string, fileTypes: Array<{ value: string, label: string, dork: string }>) => {
    return fileTypes.find(t => t.value === type)?.label.toLowerCase() || 'files';
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    typingQuery, 
    setTypingQuery, 
    className = '', 
    showSettings = false,
    onSettingsClick, 
    onFileTypeChange, 
    selectedFileType, 
    fileTypes 
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [currentPlaceholder, setCurrentPlaceholder] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [searchTerm, setSearchTerm] = useState(typingQuery)

    useEffect(() => {
        setSearchTerm(typingQuery)
    }, [typingQuery])

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
        setTypingQuery(searchTerm)
        onSearch(searchTerm)
        setShowSuggestions(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        setTypingQuery(value)
        debouncedGenerateSuggestions(value)
    }

    const handleFileTypeChange = (value: string) => {
        onFileTypeChange(value)
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
        setTimeout(() => {
            onSearch(suggestion)
        }, 0)
    }

    return (
        <div className="relative w-full">
            <div className={`w-full border rounded-xl overflow-hidden transition-all duration-300 bg-white/50 dark:bg-gray-900 ${
                isSearchFocused ? 'border-gray-500 shadow-none' : 'border-gray-200 dark:border-gray-800'
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
                            className={`border-none font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent ${
                                showSettings ? 'h-9 px-3' : 'h-12 px-4'
                            }`}
                        />
                    </div>
                    <div className="flex items-stretch h-full divide-x divide-gray-200 dark:divide-gray-800">
                        <div className={`flex items-center ${showSettings ? 'px-1.5' : 'px-2'}`}>
                            <Select value={selectedFileType} onValueChange={handleFileTypeChange}>
                                <SelectTrigger className={`w-full border-0 bg-transparent focus:ring-0 shadow-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${
                                    showSettings ? 'h-7' : 'h-9'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <FileTypeIcon type={selectedFileType} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="w-48">
                                    {fileTypes.map((fileType) => (
                                        <SelectItem 
                                            key={fileType.value} 
                                            value={fileType.value}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <FileTypeIcon type={fileType.value} />
                                                <span className="flex-1">{fileType.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <button
                            onClick={handleSearch}
                            className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center ${
                                showSettings ? 'px-2' : 'px-3'
                            }`}
                        >
                            <Search className={`text-gray-500 dark:text-gray-400 ${
                                showSettings ? 'w-4 h-4' : 'w-5 h-5'
                            }`} />
                        </button>
                        {showSettings && (
                            <button
                                onClick={onSettingsClick}
                                className="px-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                            >
                                <Settings2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {selectedFileType !== 'all' && !showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="m-3 flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <FileTypeIcon type={selectedFileType} />
                        <span>
                            Searching for {getFileTypeLabel(selectedFileType, fileTypes)} only
                        </span>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900 z-50 max-h-[300px] overflow-y-auto"
                        style={{ 
                            width: "calc(100% - 1rem)",
                            margin: "0.5rem",
                            top: "100%"
                        }}
                    >
                        {suggestions.map((suggestion, index) => (
                            <motion.div
                                key={suggestion}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                                <div 
                                    className="flex-1 flex items-center"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <Search className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="truncate">{suggestion}</span>
                                </div>
                                <button
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full ml-2"
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