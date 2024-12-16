import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PopoverContent } from "@/components/ui/popover"
import { Badge as ShadcnBadge } from "@/components/ui/badge"
import { PlusCircle } from 'lucide-react'
import { toast } from "sonner"

const sites = [
    { name: 'Universal search', icon: '/logo.svg' },
    { name: 'Reddit.com', icon: '/reddit.svg' },
    { name: 'Twitter.com', icon: '/twitter.svg' },
    { name: 'Quora.com', icon: '/quora.svg' },
    { name: 'news.ycombinator.com', icon: '/y-combinator.svg' },
    { name: 'Dev.to', icon: '/dev.svg' },
    { name: 'stackexchange.com', icon: '/stackexchange.svg' },
]

interface LoggedOutSettingsPopoverProps {
    selectedSite: string
    badgetext: string
    setSelectedSite: (site: string) => void
    resultCount: number
    currentFilter: string
    onValueChange?: (value: string) => void
}

export const LoggedOutSettingsPopover: React.FC<LoggedOutSettingsPopoverProps> = ({
    selectedSite,
    badgetext,
    setSelectedSite,
    resultCount,
    currentFilter,
    onValueChange
}) => (
    <PopoverContent className="w-60 ml-5 shadow-none">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="site-select">Site</Label>
                <Select
                    value={selectedSite}
                    onValueChange={(value) => ['Reddit.com', 'Twitter.com'].includes(value) && setSelectedSite(value)}
                >
                    <SelectTrigger id="site-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map((site) => (
                            <SelectItem
                                key={site.name}
                                value={site.name}
                                disabled={!['Reddit.com', 'Twitter.com'].includes(site.name)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                        <Image src={site.icon} alt={site.name} width={16} height={16} className="mr-2" />
                                        {site.name}
                                    </div>
                                    {!['Reddit.com', 'Twitter.com'].includes(site.name) && (
                                        <Link href='/checkout'>
                                            <ShadcnBadge className="ml-2 text-xs rounded-full">
                                                {badgetext}
                                            </ShadcnBadge>
                                        </Link>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                        <SelectItem disabled={true} value="custom" className="border rounded-md">
                            <div className="flex items-center">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                <span>Custom Site</span>
                                <Link href='/checkout'>
                                    <ShadcnBadge className="ml-2 text-xs rounded-full">
                                        {badgetext}
                                    </ShadcnBadge>
                                </Link>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="result-count">Result Count</Label>
                <Select value={resultCount.toString()} onValueChange={onValueChange}>
                    <SelectTrigger id="result-count">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50].map((count) => (
                            <SelectItem key={count} value={count.toString()} disabled>
                                <div className="flex items-center justify-between w-full">
                                    <span>{count}</span>
                                    <Link href='/checkout'>
                                        <ShadcnBadge className="ml-2 text-xs rounded-full">
                                            {badgetext}
                                        </ShadcnBadge>
                                    </Link>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filter by</Label>
                <RadioGroup value={currentFilter} disabled>
                    {['today', 'week', 'newest', 'oldest', 'lifetime'].map((filter) => (
                        <div key={filter} className="flex items-center justify-between space-x-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={filter} id={filter} />
                                <Label htmlFor={filter}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Label>
                            </div>
                            <Link href='/login'>
                                <ShadcnBadge className="ml-2 text-xs rounded-full">
                                    {badgetext}
                                </ShadcnBadge>
                            </Link>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    </PopoverContent>
)

interface LoggedInSettingsPopoverProps {
    selectedSite: string
    setSelectedSite: (site: string) => void
    resultCount: number
    setResultCount: (count: number) => void
    currentFilter: string
    handleFilterChange: (filter: string) => void
    customUrl: string
    setCustomUrl: (url: string) => void
    membership: string
}

export const LoggedInSettingsPopover: React.FC<LoggedInSettingsPopoverProps> = ({
    selectedSite,
    setSelectedSite,
    resultCount,
    setResultCount,
    currentFilter,
    handleFilterChange,
    customUrl,
    setCustomUrl,
    membership
}) => (
    <PopoverContent className="w-60 ml-5 shadow-none">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="site-select">Site</Label>
                <Select
                    value={selectedSite}
                    onValueChange={(value) => {
                        if (value === 'custom') {
                            setSelectedSite('custom')
                        } else {
                            setSelectedSite(value)
                        }
                    }}
                >
                    <SelectTrigger id="site-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map((site) => (
                            <SelectItem key={site.name} value={site.name}>
                                <div className="flex items-center">
                                    <Image src={site.icon} alt={site.name} width={16} height={16} className="mr-2" />
                                    {site.name}
                                </div>
                            </SelectItem>
                        ))}
                        <SelectItem value="custom" className="border rounded-md">
                            <div className="flex items-center">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                <span>{customUrl || "Custom Site"}</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedSite === 'custom' && (
                <div className="space-y-2">
                    <Label htmlFor="custom-url">Custom URL</Label>
                    <div className="flex items-center">
                        <Input
                            id="custom-url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="Enter custom domain"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="ml-2"
                            onClick={() => {
                                if (customUrl) {
                                    setSelectedSite(customUrl)
                                    toast.success("Custom domain set")
                                } else {
                                    toast.error("Please enter a custom domain")
                                }
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="result-count">Result Count</Label>
                <Select
                    value={resultCount.toString()}
                    onValueChange={(value) => setResultCount(parseInt(value, 10))}
                >
                    <SelectTrigger id="result-count">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50].map((count) => (
                            <SelectItem key={count} value={count.toString()}>
                                {count}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Filter by</Label>
                <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
                    {['today', 'week', 'newest', 'oldest', 'lifetime'].map((filter) => (
                        <div key={filter} className="flex items-center space-x-2">
                            <RadioGroupItem value={filter} id={filter} />
                            <Label htmlFor={filter}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    </PopoverContent>
) 