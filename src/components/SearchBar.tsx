import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, Settings2, FileText, FileType, FileSpreadsheet, Presentation, FileJson, FileCode, Archive, ChevronDown, Code } from 'lucide-react'

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

const DORK_OPERATORS = [
    {
        category: 'Content Search',
        operators: [
            { 
                operator: 'intitle:',
                description: 'Search in page title',
                example: 'intitle:"machine learning"'
            },
            { 
                operator: 'intext:',
                description: 'Search in page content',
                example: 'intext:quantum computing'
            },
            { 
                operator: '"..."',
                description: 'Exact match',
                example: '"artificial intelligence"'
            },
            {
                operator: 'related:',
                description: 'Find similar websites',
                example: 'related:arxiv.org'
            }
        ]
    },
    {
        category: 'File & URL',
        operators: [
            { 
                operator: 'filetype:',
                description: 'Search by file type',
                example: 'filetype:pdf research'
            },
            { 
                operator: 'inurl:',
                description: 'Search in URL',
                example: 'inurl:research'
            },
            { 
                operator: 'site:',
                description: 'Search specific domain',
                example: 'site:edu quantum'
            }
        ]
    },
    {
        category: 'Filters',
        operators: [
            { 
                operator: '-',
                description: 'Exclude terms',
                example: 'AI -chatgpt'
            },
            { 
                operator: 'OR',
                description: 'Match either term',
                example: 'python OR javascript'
            },
            {
                operator: 'cache:',
                description: 'View cached version',
                example: 'cache:website.com'
            }
        ]
    },
    {
        category: 'Time & Date',
        operators: [
            { 
                operator: 'before:',
                description: 'Before date',
                example: 'before:2023'
            },
            { 
                operator: 'after:',
                description: 'After date',
                example: 'after:2022'
            }
        ]
    }
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
    const [searchTerm, setSearchTerm] = useState("")
    const [showDorkingHelper, setShowDorkingHelper] = useState(false)

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
        
        console.log('Final search query:', searchTerm) // Debug log
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
        // Esegui la ricerca immediatamente con la suggestion
        onSearch(suggestion)
    }

    const DorkingHelper = () => {
        return (
            <div className="absolute mt-1 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 w-full z-40">
                <div className="space-y-4">
                    {DORK_OPERATORS.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                                {category.category}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {category.operators.map((dork) => (
                                    <div 
                                        key={dork.operator}
                                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                                        onClick={() => {
                                            const currentValue = searchInputRef.current?.value || '';
                                            const newValue = `${currentValue} ${dork.operator} `.trim();
                                            if (searchInputRef.current) {
                                                searchInputRef.current.value = newValue;
                                                searchInputRef.current.focus();
                                                setSearchTerm(newValue);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                                                {dork.operator}
                                            </code>
                                            <span className="text-xs text-muted-foreground">
                                                {dork.description}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground/60 italic">
                                            {dork.example}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
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
                                <SelectTrigger className="w-12 border-0 bg-transparent focus:ring-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileTypeIcon type={selectedFileType} />
                                        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
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
                        <button
                            onClick={() => setShowDorkingHelper(!showDorkingHelper)}
                            className="px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Code className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Aggiungi questo badge informativo */}
                {selectedFileType !== 'all' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
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

            {showDorkingHelper && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <DorkingHelper />
                </motion.div>
            )}
        </>
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