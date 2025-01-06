import React, { useRef, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, Settings2, FileText, FileType, FileSpreadsheet, Presentation, FileJson, FileCode, Archive, ChevronDown, Globe, Play, Share2, Mail, Phone, MapPin, MessageCircle, Hash, AtSign, History, XIcon, ImagePlus, Upload, SparklesIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type SearchType = 'web' | 'media' | 'social';

export interface SearchFilters {
    // Product filters
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    
    // Social filters
    platform?: 'all' | 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'reddit';
    includeContacts?: boolean;
    includeHashtags?: boolean;
    includeMentions?: boolean;
    includeComments?: boolean;
    contentType?: 'all' | 'posts' | 'profiles' | 'discussions' | 'videos' | 'images';
    imageUrl?: string;
    image?: string;
    imageFile?: string;
    isImageSearch?: boolean;
}

interface SearchBarProps {
    onSearch: (query: string, searchType: SearchType, filters?: SearchFilters) => void
    typingQuery: string
    setTypingQuery: (query: string) => void
    className?: string
    showSettings?: boolean
    isScrolled?: boolean
    onSettingsClick?: () => void
    onFileTypeChange: (value: string) => void
    selectedFileType: string
    fileTypes: Array<{ value: string, label: string, dork: string }>
    searchType?: SearchType
    onSearchTypeChange?: (type: SearchType) => void
    showHistory?: boolean
    onHistoryClick?: () => void
}

const placeholderQueries = {
    web: [
        "Let's find groundbreaking research...",
        "Let's discover academic papers...",
        "Let's explore scientific articles...",
        "Let's search technical documents...",
        "Let's find expert publications..."
    ],
    media: [
        "Let's find amazing videos...",
        "Let's discover stunning images...",
        "Let's explore visual content...",
        "Let's find viral videos...",
        "Let's search for media..."
    ],
    social: [
        "Let's find trending discussions...",
        "Let's discover influencer insights...",
        "Let's explore social conversations...",
        "Let's find viral content...",
        "Let's search social mentions..."
    ]
}

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

const SearchTypeButton = ({ type, active, icon: Icon, onClick, children, compact = false }: { 
    type: SearchType, 
    active: boolean, 
    icon: React.ElementType,
    onClick: () => void,
    children: React.ReactNode,
    compact?: boolean
}) => (
    <Button
        variant={active ? "default" : "ghost"}
        className={`flex items-center gap-2 transition-colors ${
            active 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        } ${
            compact ? 'h-7 px-2 text-xs' : ''
        }`}
        onClick={onClick}
    >
        <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
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

const SocialFilters = ({ filters, onChange }: { 
    filters: SearchFilters, 
    onChange: (filters: SearchFilters) => void 
}) => {
    return (
        <div className="p-4 space-y-4 border-t">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Social search uses 1 credit per search</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                    value={filters.platform || 'all'}
                    onValueChange={(value) => onChange({ ...filters, platform: value as SearchFilters['platform'] })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="reddit">Reddit</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                    value={filters.contentType || 'all'}
                    onValueChange={(value) => onChange({ ...filters, contentType: value as SearchFilters['contentType'] })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="posts">Posts</SelectItem>
                        <SelectItem value="profiles">Profiles</SelectItem>
                        <SelectItem value="discussions">Discussions</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3">
                <Label>Include</Label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="contacts"
                            checked={filters.includeContacts}
                            onCheckedChange={(checked) => onChange({ ...filters, includeContacts: !!checked })}
                        />
                        <Label htmlFor="contacts" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Contact Info
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="hashtags"
                            checked={filters.includeHashtags}
                            onCheckedChange={(checked) => onChange({ ...filters, includeHashtags: !!checked })}
                        />
                        <Label htmlFor="hashtags" className="flex items-center gap-2">
                            <Hash className="w-4 h-4" /> Hashtags
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="mentions"
                            checked={filters.includeMentions}
                            onCheckedChange={(checked) => onChange({ ...filters, includeMentions: !!checked })}
                        />
                        <Label htmlFor="mentions" className="flex items-center gap-2">
                            <AtSign className="w-4 h-4" /> Mentions
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="comments"
                            checked={filters.includeComments}
                            onCheckedChange={(checked) => onChange({ ...filters, includeComments: !!checked })}
                        />
                        <Label htmlFor="comments" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" /> Comments
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MediaFilters = ({ filters, onChange }: { 
    filters: SearchFilters, 
    onChange: (filters: SearchFilters) => void 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewUrl(base64String);
                onChange({ ...filters, imageFile: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-4 space-y-4 border-t">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <SparklesIcon className="w-4 h-4" />
                    <span>Vision search uses 1 credit per image search</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                    value={filters.contentType || 'all'}
                    onValueChange={(value) => onChange({ ...filters, contentType: value as SearchFilters['contentType'] })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="videos">Videos</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Search by Image</Label>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <div className="flex flex-col gap-2">
                    {previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-border">
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="w-full h-32 object-cover"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                    setPreviewUrl('');
                                    onChange({ ...filters, imageFile: undefined });
                                }}
                            >
                                <XIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full h-32 flex flex-col gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-6 w-6" />
                            <span>Upload an image</span>
                            <span className="text-xs text-muted-foreground">
                                Click to browse or drag and drop
                            </span>
                        </Button>
                    )}
                </div>
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
    isScrolled = false,
    onSettingsClick, 
    onFileTypeChange, 
    selectedFileType, 
    fileTypes,
    searchType = 'web',
    onSearchTypeChange = () => {},
    showHistory = false,
    onHistoryClick = () => {}
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
    const [currentPlaceholder, setCurrentPlaceholder] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [searchTerm, setSearchTerm] = useState(typingQuery)
    const [currentSearchType, setCurrentSearchType] = useState<SearchType>(searchType)
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({})

    // Placeholder animation with typing effect
    useEffect(() => {
        const text = placeholderQueries[currentSearchType][currentPlaceholderIndex]
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
                            setCurrentPlaceholderIndex((prev) => 
                                (prev + 1) % placeholderQueries[currentSearchType].length
                            )
                        }, 2000)
                    }, 1000)
                }
            }, 100)
        }

        return () => clearInterval(typingInterval)
    }, [currentPlaceholderIndex, isTyping, currentSearchType])

    // Reset placeholder and animation when search type changes
    useEffect(() => {
        setCurrentPlaceholderIndex(0)
        setCurrentPlaceholder('')
        setIsTyping(true)
    }, [currentSearchType])

    useEffect(() => {
        setSearchTerm(typingQuery)
    }, [typingQuery])

    useEffect(() => {
        setCurrentSearchType(searchType)
    }, [searchType])

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
    const handleSearchTypeClick = (type: SearchType) => {
        setCurrentSearchType(type)
        onSearchTypeChange(type)
        
        // Se c'è una query attiva, esegui la ricerca
        if (typingQuery.trim()) {
            onSearch(typingQuery, type)
        }
    }

    const handleSearch = () => {
        if (!searchTerm.trim()) return
        // First scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Then trigger the search after a small delay to ensure smooth scroll
        setTimeout(() => {
            setTypingQuery(searchTerm)
            onSearch(searchTerm, currentSearchType, searchFilters)
            setShowSuggestions(false)
        }, 100)
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
            e.preventDefault()
            handleSearch()
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion)
        setTypingQuery(suggestion)
        setShowSuggestions(false)
        // First scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Then trigger the search after a small delay to ensure smooth scroll
        setTimeout(() => {
            onSearch(suggestion, currentSearchType, searchFilters)
        }, 100)
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Switch to media type
                setCurrentSearchType('media');
                onSearchTypeChange('media');
                // Pass only the image data without a text query
                onSearch('', 'media', { 
                    image: base64String,
                    isImageSearch: true
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full space-y-2">
            <div className={`flex items-center gap-2 justify-center ${showSettings ? 'mb-2' : 'mb-4'}`}>
                {showSettings && isScrolled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center absolute left-4 md:left-[calc(50%-280px)]"
                    >
                        <span className="font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            LEXY
                        </span>
                    </motion.div>
                )}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <SearchTypeButton
                            type="web"
                            active={currentSearchType === 'web'}
                            icon={Globe}
                            onClick={() => handleSearchTypeClick('web')}
                            compact={showSettings}
                        >
                            Web
                        </SearchTypeButton>
                        <SearchTypeButton
                            type="social"
                            active={currentSearchType === 'social'}
                            icon={Share2}
                            onClick={() => handleSearchTypeClick('social')}
                            compact={showSettings}
                        >
                            Social
                        </SearchTypeButton>
                        <SearchTypeButton
                            type="media"
                            active={currentSearchType === 'media'}
                            icon={Play}
                            onClick={() => handleSearchTypeClick('media')}
                            compact={showSettings}
                        >
                            Media
                        </SearchTypeButton>
                    </div>
                    {currentSearchType === 'social' && !isScrolled && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400"
                        >
                            <SparklesIcon className="w-3 h-3" />
                            <span>Uses 1 credit per search</span>
                        </motion.div>
                    )}
                    {currentSearchType === 'media' && !isScrolled && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400"
                        >
                            <SparklesIcon className="w-3 h-3" />
                            <span>Vision search uses 1 credit per image</span>
                        </motion.div>
                    )}
                </div>
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
                        
                        <div className="flex items-stretch h-full divide-x divide-gray-200 dark:divide-gray-800">
                            {/* Image upload button - only show for media search */}
                            {currentSearchType === 'media' && (
                                <div className={`flex items-center ${showSettings ? 'px-1.5' : 'px-2'}`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`w-8 h-8 ${showSettings ? 'h-7 w-7' : ''}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* File type selector - shown only for web search */}
                            {currentSearchType === 'web' && (
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
                            )}

                            {/* History button - always visible */}
                            {showHistory && (
                                <div className={`flex items-center ${showSettings ? 'px-1.5' : 'px-2'} border-l border-gray-200 dark:border-gray-800`}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`w-8 h-8 ${showSettings ? 'h-7 w-7' : ''}`}
                                        onClick={onHistoryClick}
                                    >
                                        <History className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Show filters for marketplace and social */}
                            {(currentSearchType === 'media' || currentSearchType === 'social') && (
                                <div className="px-2 border-l border-gray-200 dark:border-gray-800">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className={`h-8 px-2 ${showSettings ? 'h-7' : ''}`}>
                                                <Settings2 className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0">
                                            {currentSearchType === 'media' && (
                                                <MediaFilters
                                                    filters={searchFilters}
                                                    onChange={setSearchFilters}
                                                />
                                            )}
                                            {currentSearchType === 'social' && (
                                                <SocialFilters
                                                    filters={searchFilters}
                                                    onChange={setSearchFilters}
                                                />
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

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
                            {!showSettings && onSettingsClick && (
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