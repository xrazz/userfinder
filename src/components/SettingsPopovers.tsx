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
import { Slider } from "@/components/ui/slider"

const sites = [
    { name: 'Universal search', icon: '/logo.svg' },
    { name: 'Reddit.com', icon: '/reddit.svg' },
    { name: 'Twitter.com', icon: '/twitter.svg' },
    { name: 'Quora.com', icon: '/quora.svg' },
    { name: 'news.ycombinator.com', icon: '/y-combinator.svg' },
    { name: 'Dev.to', icon: '/dev.svg' },
    { name: 'stackexchange.com', icon: '/stackexchange.svg' },
]

const timeRanges = [
    { value: "24h", label: "Last 24 hours" },
    { value: "week", label: "Last week" },
    { value: "month", label: "Last month" },
    { value: "3months", label: "Last 3 months" },
    { value: "6months", label: "Last 6 months" },
    { value: "year", label: "Last year" },
    { value: "all", label: "All time" }
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
    <PopoverContent className="w-80 shadow-md">
        <div className="space-y-4 p-2">
            <div className="space-y-2">
                <Label htmlFor="site-select" className="text-sm font-medium">Site</Label>
                <Select
                    value={selectedSite}
                    onValueChange={(value) => ['Reddit.com', 'Twitter.com'].includes(value) && setSelectedSite(value)}
                >
                    <SelectTrigger id="site-select" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {sites.map((site) => (
                            <SelectItem
                                key={site.name}
                                value={site.name}
                                disabled={!['Reddit.com', 'Twitter.com'].includes(site.name)}
                                className="py-2"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                        <Image src={site.icon} alt={site.name} width={20} height={20} className="mr-3" />
                                        {site.name}
                                    </div>
                                    {!['Reddit.com', 'Twitter.com'].includes(site.name) && (
                                        <Link href='/subscription'>
                                            <ShadcnBadge className="ml-2 text-xs">
                                                {badgetext}
                                            </ShadcnBadge>
                                        </Link>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                        <SelectItem disabled={true} value="custom" className="border-t py-2">
                            <div className="flex items-center">
                                <PlusCircle className="w-5 h-5 mr-3" />
                                <span>Custom Site</span>
                                <Link href='/subscription'>
                                    <ShadcnBadge className="ml-2 text-xs">
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
    currentFilter: string
    handleFilterChange: (filter: string) => void
    customUrl: string
    setCustomUrl: (url: string) => void
    membership: string
}

export const LoggedInSettingsPopover: React.FC<LoggedInSettingsPopoverProps> = ({
    selectedSite,
    setSelectedSite,
    currentFilter,
    handleFilterChange,
    customUrl,
    setCustomUrl,
    membership
}) => (
    <PopoverContent className="w-80 shadow-md">
        <div className="space-y-4 p-2">
            <div className="space-y-2">
                <Label htmlFor="site-select" className="text-sm font-medium">Site</Label>
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
                    <SelectTrigger id="site-select" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {sites.map((site) => (
                            <SelectItem key={site.name} value={site.name} className="py-2">
                                <div className="flex items-center">
                                    <Image src={site.icon} alt={site.name} width={20} height={20} className="mr-3" />
                                    {site.name}
                                </div>
                            </SelectItem>
                        ))}
                        <SelectItem value="custom" className="border-t py-2">
                            <div className="flex items-center">
                                <PlusCircle className="w-5 h-5 mr-3" />
                                <span>{customUrl || "Custom Site"}</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedSite === 'custom' && (
                <div className="space-y-2">
                    <Label htmlFor="custom-url" className="text-sm font-medium">Custom URL</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="custom-url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="Enter custom domain"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                if (customUrl) {
                                    setSelectedSite(customUrl)
                                    toast.success("Custom domain set")
                                } else {
                                    toast.error("Please enter a custom domain")
                                }
                            }}
                        >
                            Set
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <Label className="text-sm font-medium">Time Range</Label>
                <Slider
                    defaultValue={[timeRanges.findIndex(t => t.value === currentFilter)]}
                    max={timeRanges.length - 1}
                    step={1}
                    className="py-4"
                    onValueChange={(value: number[]) => handleFilterChange(timeRanges[value[0]].value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>24h</span>
                    <span>All time</span>
                </div>
                <div className="text-sm font-medium text-center text-primary">
                    {timeRanges.find(t => t.value === currentFilter)?.label}
                </div>
            </div>
        </div>
    </PopoverContent>
) 