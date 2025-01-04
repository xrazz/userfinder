import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, Settings2, FileText, FileType, FileSpreadsheet, Presentation, FileJson, FileCode, Archive, ChevronDown, Globe, ShoppingBag, Users, Mail, Phone, MapPin, Share2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type SearchType = 'web' | 'products' | 'people';

interface SearchFilters {
    // Product filters
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    
    // People filters
    includeEmail?: boolean;
    includePhone?: boolean;
    includeSocial?: boolean;
    
    // News filters
    dateRange?: string;
    source?: string;
}

interface SearchBarProps {
    onSearch: (query: string, searchType: SearchType, filters?: SearchFilters) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
    className?: string
    showSettings?: boolean
    onSettingsClick?: () => void
    onFileTypeChange: (value: string) => void
    selectedFileType: string
    fileTypes: Array<{ value: string, label: string, dork: string }>
    searchType?: SearchType
    onSearchTypeChange?: (type: SearchType) => void
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

const SearchTypeButton = ({ type, active, icon: Icon, onClick, children }: { 
    type: SearchType, 
    active: boolean, 
    icon: React.ElementType,
    onClick: () => void,
    children: React.ReactNode 
}) => (
    <Button
        variant={active ? "default" : "ghost"}
        className={`flex items-center gap-2 ${active ? '' : 'hover:bg-gray-100'}`}
        onClick={onClick}
    >
        <Icon className="w-4 h-4" />
        {children}
    </Button>
)

const ProductFilters = ({ filters, onChange }: { 
    filters: SearchFilters, 
    onChange: (filters: SearchFilters) => void 
}) => {
    return (
        <div className="p-4 space-y-4 border-t">
            <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) })}
                        className="w-24"
                    />
                    <span>to</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
                        className="w-24"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Enter location"
                        value={filters.location || ''}
                        onChange={(e) => onChange({ ...filters, location: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};

const PeopleFilters = ({ filters, onChange }: { 
    filters: SearchFilters, 
    onChange: (filters: SearchFilters) => void 
}) => {
    return (
        <div className="p-4 space-y-3 border-t">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="email"
                    checked={filters.includeEmail}
                    onCheckedChange={(checked) => onChange({ ...filters, includeEmail: !!checked })}
                />
                <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Include email addresses
                </Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    id="phone"
                    checked={filters.includePhone}
                    onCheckedChange={(checked) => onChange({ ...filters, includePhone: !!checked })}
                />
                <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Include phone numbers
                </Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox
                    id="social"
                    checked={filters.includeSocial}
                    onCheckedChange={(checked) => onChange({ ...filters, includeSocial: !!checked })}
                />
                <Label htmlFor="social" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Include social profiles
                </Label>
            </div>
        </div>
    );
};

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    typingQuery, 
    setTypingQuery, 
    className = '', 
    showSettings = false,
    onSettingsClick, 
    onFileTypeChange, 
    selectedFileType, 
    fileTypes,
    searchType = 'web',
    onSearchTypeChange = () => {}
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [currentPlaceholder, setCurrentPlaceholder] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [searchTerm, setSearchTerm] = useState(typingQuery)
    const [currentSearchType, setCurrentSearchType] = useState<SearchType>(searchType)
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({})

    useEffect(() => {
        setSearchTerm(typingQuery)
    }, [typingQuery])

    useEffect(() => {
        setCurrentSearchType(searchType)
    }, [searchType])

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
        onSearch(searchTerm, currentSearchType, searchFilters)
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
            onSearch(suggestion, currentSearchType, searchFilters)
        }, 0)
    }

    const handleSearchTypeClick = (type: SearchType) => {
        setCurrentSearchType(type)
        onSearchTypeChange(type)
        // Reset filters when changing search type
        setSearchFilters({})
        if (searchTerm.trim()) {
            onSearch(searchTerm, type, searchFilters)
        }
    }

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center gap-2 justify-center mb-4">
                <SearchTypeButton
                    type="web"
                    active={currentSearchType === 'web'}
                    icon={Globe}
                    onClick={() => handleSearchTypeClick('web')}
                >
                    Web
                </SearchTypeButton>
                <SearchTypeButton
                    type="products"
                    active={currentSearchType === 'products'}
                    icon={ShoppingBag}
                    onClick={() => handleSearchTypeClick('products')}
                >
                    Products
                </SearchTypeButton>
                <SearchTypeButton
                    type="people"
                    active={currentSearchType === 'people'}
                    icon={Users}
                    onClick={() => handleSearchTypeClick('people')}
                >
                    People
                </SearchTypeButton>
            </div>
            
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
                        
                        {/* Type-specific filters */}
                        {(currentSearchType === 'products' || currentSearchType === 'people') && (
                            <div className="px-2 border-l border-gray-200 dark:border-gray-800">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 px-2">
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0">
                                        {currentSearchType === 'products' && (
                                            <ProductFilters
                                                filters={searchFilters}
                                                onChange={setSearchFilters}
                                            />
                                        )}
                                        {currentSearchType === 'people' && (
                                            <PeopleFilters
                                                filters={searchFilters}
                                                onChange={setSearchFilters}
                                            />
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

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