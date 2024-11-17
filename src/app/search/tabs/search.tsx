// import React from 'react'

"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bookmark, AlertCircle, Settings2, ArrowUp, Search, Link2, Plus, Zap, Users, Building } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast, Toaster } from "sonner"
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { checkAndUpdateMembership, db, reduceUserCredit } from '@/app/firebaseClient'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TabDataSkeleton from './tabsui/searchProgressUI'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@radix-ui/themes'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'




const MEMBERSHIP_LEVELS = {
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro'
};

enum DateFilter {
  Today = 'today',
  Week = 'last week',
  Latest = 'last 2 months',
  Oldest = 'last 2 years',
  Lifetime = 'no date filter'
}
interface Post {
  title: string
  link: string
  snippet: string
}
const sites = [
  { name: 'Reddit.com', icon: '/reddit.svg' },
  { name: 'Twitter.com', icon: '/twitter.svg' },
  { name: 'Quora.com', icon: '/quora.svg' },
  { name: 'news.ycombinator.com', icon: '/y-combinator.svg' },
  { name: 'Dev.to', icon: '/dev.svg' },
  { name: 'stackexchange.com', icon: '/stackexchange.svg' },
]

const SearchTab = ({ membership = '', name = '', email = '', userId = '' }: { membership: string, name: string, email: string, userId: string }) => {

  const [searchQuery, setSearchQuery] = useState('')
  // const [queryToSend, setQueryToSend] = useState('')
  const [currentFilter, setCurrentFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<Post[]>([]);
  // const [credits, setCredits] = useState(0)
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)
  const [selectedSite, setSelectedSite] = useState('Reddit.com')
  const [resultCount, setResultCount] = useState<number>(10)
  const [customUrl, setCustomUrl] = useState('')
  const [credits, setCredits] = useState(0);
  const router = useRouter()
  useEffect(() => {
    if (!email) return;

    // Reference to the user's document
    const userDocRef = doc(db, 'users', email);

    // Set up the real-time listener
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const currentCredits = docSnapshot.data().credits;
        setCredits(currentCredits);

        // Check if credits are 5 or less
        if (currentCredits <= 0) {
          // Show a popup or alert
          setShowPremiumDialog(true)
          // alert('Your credits are running low!');
          console.log(`Credits are at a critical level: ${currentCredits}`);
        }
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [email]);


  useEffect(() => {
    // Check if any data list has been filled, indicating data is ready to display
    if (
      searchData.length > 0

    ) {
      // console.log('data is there')
      setLoading(false);  // Stop loading when data is ready
    }


  }, [searchData]);

  useEffect(() => {
    const cachedData = JSON.parse(localStorage.getItem(`searchData`) || '[]');

    setSearchData(cachedData)
    console.log(cachedData)
    checkAndUpdateMembership(email)
    return () => {
      console.log("Component unmounted");
    };
  }, [])

  const handleResultCountChange = (value: string) => {
    setResultCount(parseInt(value, 10));
  };
  const fetchResult = async (query: string): Promise<any[]> => {
    try {
      // Send request to API with search query
      const response = await fetch('/api/searchApify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query, num: resultCount })
      });

      // Check for response success
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();

      // Handle API response based on success property
      if (data.success) {
        return data.data;  // Return data if successful
      } else {
        throw new Error(data.error || 'Unknown API error occurred');
      }
    } catch (error: any) {
      console.error('Error fetching results:', error.message || error);
      return [];  // Return empty array on failure
    }
  };




  const handleSearch = async () => {

    if (userId.trim() === '') {
      window.location.href = '/login';

    }
    if (searchQuery.trim() !== '') {
      // const dateFilter = mapFilterToDate(currentFilter);
      const siteToSearch = selectedSite === 'custom' ? customUrl : selectedSite
      // Check premium status and available credits

      if (membership === MEMBERSHIP_LEVELS.FREE && credits <= 0) {
        setShowPremiumDialog(true);
        return;
      }

      // Reset previous data and loading state
      setSearchData([]);
      setLoading(true);

      try {
        const dateFilterString = getDateFilterString(mapFilterToDate(currentFilter));
        // Perform fetch with provided site, search query, and date filter
        const Results = await fetchResult(`site:${siteToSearch} ${searchQuery} ${dateFilterString} `);

        // Update search data and query state
        setSearchData(Results);
        localStorage.setItem('searchData', JSON.stringify(Results));
        localStorage.setItem('history', JSON.stringify({ title: searchQuery, data: Results }));
        // console.log(localStorage.getItem('searchData'))
        // setQueryToSend(searchQuery);

        // Update credits asynchronously without blocking loading state
        reduceUserCredit(email)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // Ensure loading stops, even if an error occurs
        setLoading(false);
      }
    }

  };

  // KeyDown handler for Enter key to trigger search
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('tapped bro')
    if (event.key === 'Enter' && searchQuery.trim() !== '') {
      handleSearch();
    }
  };

  // Filter change handler to set and close filter
  const handleFilterChange = (value: string) => {
    setCurrentFilter(value);
    setIsFilterOpen(false);
  };

  // URL decoder function for readability
  const decodeUrl = (encodedUrl: string): string => decodeURIComponent(encodedUrl);

  // Map filter option to appropriate date filter constant
  const mapFilterToDate = (filter: string) => {
    switch (filter) {
      case 'today': return DateFilter.Today;
      case 'week': return DateFilter.Week;
      case 'newest': return DateFilter.Latest;
      case 'oldest': return DateFilter.Oldest;
      case 'lifetime': return DateFilter.Lifetime;
      default: return DateFilter.Lifetime;
    }
  };

  // Bookmark handling with async and toast notification for feedback
  const handleBookmark = async (post: Post) => {
    try {
      // Retrieve the existing bookmarks from localStorage or initialize an empty array
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

      // Add the new post to the bookmarks list
      const updatedBookmarks = [...existingBookmarks, post];

      // Save the updated bookmarks back to localStorage
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
      // console.log( localStorage.getItem('bookmarks'))
      // Show a toast notification for feedback
      toast.success("Added to bookmarks", {
        description: `Bookmarked: ${post.title}`,
      });
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast.error("Failed to add bookmark", {
        description: "An error occurred while adding the bookmark.",
      });
    }
  };





  const TabData = ({ platform, posts, logo }: { platform: string; posts: Post[]; logo: string }) => {

    const handleEngage = (link: string) => {
      window.open(decodeUrl(link), '_blank');
    };

    const handleCopyUrl = (link: string) => {
      navigator.clipboard.writeText(decodeUrl(link))
        .then(() => {
          // console.log("The URL is copied");
          toast("URL has been copied", {
            action: {
              label: "OK",
              onClick: () => console.log("Undo"),
            },
          });
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          toast("Failed to copy URL", {
            description: "An error occurred while copying the URL.",
          });
        });
    };
    if (userId.trim() !== '') {
      return (
        <div className="container mx-auto  py-6">
          {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Image src={logo} alt={`${platform} Logo`} width={24} height={24} />
              <h1 className="text-xl sm:text-2xl font-bold">{platform}</h1>
            </div>
            <span className="text-sm text-muted-foreground">{currentFilter}</span>
          </div> */}

          {posts.length === 0 ? (
            <div></div>
            // <Card>
            //   <CardContent className="flex flex-col items-center justify-center h-64">
            //     <Image src="/placeholder.svg?height=100&width=100" alt="No results" width={100} height={100} className="mb-4" />
            //     <p className="text-muted-foreground">No results found for this platform.</p>
            //   </CardContent>
            // </Card>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Image src={logo} alt={`${platform} Logo`} width={24} height={24} />
                  <h1 className="text-xl sm:text-2xl font-bold">{platform}</h1>
                </div>
                <span className="text-sm text-muted-foreground">{currentFilter}</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {posts.map((post, index) => (
                  <Card key={index} className="flex shadow-none flex-col h-full">
                    <CardHeader className="flex-grow">
                      <CardTitle className="text-base font-medium leading-tight mb-2 text-blue-600">
                        <a
                          href={decodeURIComponent(post.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-2"
                        >
                          {post.title}
                        </a>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{post.snippet}</p>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => handleEngage(post.link)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="sr-only">Engage</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => handleCopyUrl(post.link)}
                        >
                          <Link2 className="w-4 h-4" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => handleBookmark(post)}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="sr-only">Save</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
    // localStorage.setItem('searchData', JSON.stringify(Results));

  };

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="bottom-center" />
      <div className="w-full max-w-3xl mx-auto px-3 py-8">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center mb-6">
          What can I help you find?
        </h1>
        {userId.trim() !== "" && membership === MEMBERSHIP_LEVELS.FREE ?
          <div className="mb-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-none bg-primary">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <p className="text-xs sm:text-sm text-foreground mr-1">
                  You have {credits} searches remaining. Get unlimited searches
                </p>

              </div>
              <div className="flex items-center gap-1 sm:gap-1 ml-2 sm:ml-1">
                <Button
                  variant="link"
                  className="text-emerald-400 hover:text-emerald-300 p-0 h-auto font-normal text-xs sm:text-sm whitespace-nowrap"
                  // onClick={onUpgrade}
                  onClick={() => router.push(`/checkout`)}
                >
                  Upgrade Plan
                </Button>

              </div>
            </div>
          </div> : ''

        }

        {/* <p>{membership}</p>
        <p>{credits}</p> */}

        <div className="w-full border border-gray-300 rounded-xl p-2">

          <div className="flex-grow relative mb-4">
            <Input
              onKeyDown={handleKeyDown}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Let's find people..."
              className="h-full border-none font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-9 h-9 rounded-[6px] hover:bg-gray-700 hover:text-white"
                  >
                    <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 ml-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-select">Site</Label>
                      <Select value={selectedSite} onValueChange={setSelectedSite}>
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
                          {membership !== MEMBERSHIP_LEVELS.PRO ?
                            <span className="flex items-center p-2 text-sm text-gray-700">
                              <Plus className="mr-2 h-4 w-4 text-gray-500" />
                              Custom URL
                              <span className="ml-auto flex items-center text-xs font-medium text-emerald-600">
                                <Zap className="mr-1 h-3 w-3" />
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                >

                                  Get Pro
                                </Button>
                              </span>
                            </span>
                            : <SelectItem value="custom">
                              <span className="flex font-semibold text-sm items-center">
                                <Plus className="mr-2 h-4 w-4" />
                                Custom URL
                              </span>
                            </SelectItem>}

                        </SelectContent>
                      </Select>
                    </div>
                    {selectedSite === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-url">Custom URL</Label>
                        <Input
                          id="custom-url"
                          type="url"
                          placeholder="example.com"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="result-count">Result Count</Label>
                      <Select
                        value={resultCount.toString()}
                        onValueChange={handleResultCountChange}
                      >
                        <SelectTrigger id="result-count">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>

                          {membership !== MEMBERSHIP_LEVELS.PRO ?
                            <span className="flex items-center p-2 text-sm text-gray-700">

                              50
                              <span className="ml-auto flex items-center text-xs font-medium text-emerald-600">
                                <Zap className="mr-1 h-3 w-3" />
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                >

                                  Get Pro
                                </Button>
                              </span>
                            </span>
                            : <SelectItem value="50">50</SelectItem>
                          }

                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by</Label>

                      {/* {membership !== MEMBERSHIP_LEVELS.PRO ? <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Today" id="Today" disabled />
                          <Label htmlFor="Today" className='flex items-center' >Today <Zap className="mr-1 ml-3 text-green-600 h-3 w-3" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Get Pro
                            </Button></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Last Week" id="Last Week" disabled />
                          <Label htmlFor="Last Week" className='flex items-center' >Last Week <Zap className="mr-1 ml-3 text-green-600 h-3 w-3" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Get Pro
                            </Button></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lifetime" id="lifetime" disabled />
                          <Label htmlFor="lifetime" className='flex items-center' >2 Months <Zap className="mr-1 ml-3 text-green-600 h-3 w-3" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Get Pro
                            </Button></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lifetime" id="lifetime" disabled />
                          <Label htmlFor="lifetime" className='flex items-center' >Oldest <Zap className="mr-1 ml-3 text-green-600 h-3 w-3" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Get Pro
                            </Button></Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lifetime" id="lifetime" disabled />
                          <Label htmlFor="lifetime" className='flex items-center' >Lifetime <Zap className="mr-1 ml-3 text-green-600 h-3 w-3" />
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Get Pro
                            </Button></Label>
                        </div>
                      </RadioGroup>
                        :
                        <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="today" id="today" />
                            <Label htmlFor="today">Today</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="week" id="week" />
                            <Label htmlFor="week">Last Week</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="newest" id="newest" />
                            <Label htmlFor="newest">Newest</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="oldest" id="oldest" />
                            <Label htmlFor="oldest">Oldest</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lifetime" id="lifetime" />
                            <Label htmlFor="lifetime">Lifetime</Label>
                          </div>

                        </RadioGroup>} */}

                      <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="today" id="today" />
                          <Label htmlFor="today">Today</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="week" id="week" />
                          <Label htmlFor="week">Last Week</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="newest" id="newest" />
                          <Label htmlFor="newest">Newest</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="oldest" id="oldest" />
                          <Label htmlFor="oldest">Oldest</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="lifetime" id="lifetime" />
                          <Label htmlFor="lifetime">Lifetime</Label>
                        </div>

                      </RadioGroup>

                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Badge size="1" color="crimson" variant="soft">
                {selectedSite === 'custom' ? (customUrl || 'Custom URL') : selectedSite}
              </Badge>
              {currentFilter && (
                <Badge className="mr" color="orange" variant="soft">
                  {mapFilterToDate(currentFilter).replace('last', '')}
                </Badge>
              )}
              <Badge color="cyan" variant="soft">{resultCount}</Badge>

            </div>

            <Button
              onClick={handleSearch}
              variant="secondary"
              size="icon"
              className="w-9 h-9 rounded-[6px] hover:bg-gray-700 hover:text-white"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </div>
              
        <div className="flex mt-3 flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            className="group text-[9px] font-bold h-4 px-2 rounded-full border shadow-none"
            onClick={() => setSearchQuery("Biggest frustrations with [product/competitor]")}
          >
            frustrations with [product/competitor]
            <ArrowUp className="h-2 w-2 rotate-45 ml-1" />
          </Button>
          <Button
            variant="outline"
            className="group text-[9px] font-bold h-4 px-2 rounded-full border shadow-none"
            onClick={() => setSearchQuery("Do [target market] need [product idea]?")}
          >
            Do [target market] need [product idea]?
            <ArrowUp className="h-2 w-2 rotate-45 ml-1" />
          </Button>
        </div>


        {loading && (<TabDataSkeleton />)}
        {membership === MEMBERSHIP_LEVELS.FREE && credits <= 0 ? upgradeView() : (
          <TabData
            platform={selectedSite === 'custom' ? customUrl : selectedSite}
            posts={searchData}
            logo={selectedSite === 'custom' ? '/custom.png' : sites.find(site => site.name === selectedSite)?.icon || '/custom.png'}
          />

        )}

      </div>

      {/* <Dialog open={showPremiumDialog && membership === MEMBERSHIP_LEVELS.FREE} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <DialogTitle className="flex-grow">Free Credits Expired</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Your 5 free credits have been used. Upgrade now to continue enjoying unlimited monthly searches.
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row">
            <Button
              onClick={() => setShowPremiumDialog(false)}
              variant="outline"
              className="mb-2 sm:mb-0 w-full sm:w-1/2 sm:mr-2 focus:ring-0 focus:ring-offset-0"
            >
              Maybe later
            </Button>
            <Button
               onClick={() => router.push(`/checkout`)}
              className="w-full sm:w-1/2"
              autoFocus
            >
              Upgrade for unlimited
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </main>)


}

export default SearchTab











function getDateFilterString(dateFilter: DateFilter): string {
  const today = new Date();

  // Helper function to format date as 'YYYY-MM-DD'
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate various dates
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);

  const twoYearsAgo = new Date(today);
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  // Format dates
  const todayStr = formatDate(today);
  const twoMonthsAgoStr = formatDate(twoMonthsAgo);
  const twoYearsAgoStr = formatDate(twoYearsAgo);
  const yesterdayStr = formatDate(yesterday);
  const oneWeekAgoStr = formatDate(oneWeekAgo);

  // Return the appropriate date filter string
  switch (dateFilter) {
    case DateFilter.Today:
      return `after:${yesterdayStr} before:${todayStr}`;
    case DateFilter.Week:
      return `after:${oneWeekAgoStr} before:${todayStr}`;
    case DateFilter.Latest:
      return `after:${twoMonthsAgoStr} before:${todayStr}`;
    case DateFilter.Oldest:
      return `after:${twoYearsAgoStr} before:${todayStr}`;
    case DateFilter.Lifetime:
      return ''; // No date filter
    default:
      return '';
  }
}






function upgradeView() {

  const router = useRouter()



  const handleUpgrade = () => {

    router.push('/plans')

  }

  return (
    <section className="bg-background min-h-screen flex flex-col p-4">
      <div className="container mx-auto flex-grow flex flex-col justify-start items-center">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground mb-3">
            ⚠️ Credits Expired
          </div>
          <h1 className="text-xl md:text-xl font-bold mb-2">Upgrade to Unlimited Searches</h1>
          {/* <p className="text-lg text-muted-foreground mb-6">Choose the plan that fits your needs and never worry about credits again!</p> */}
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="bg-[#f8f8f8] p-4 rounded-lg shadow-sm relative">
            <div className="absolute right-2 top-2">
              <Badge variant="soft" className="text-[10px] px-1.5 py-0.5">Popular</Badge>
            </div>
            <div className="mb-3 text-center">
              <Search className="w-8 h-8 mb-2 text-primary mx-auto" />
              <h3 className="font-medium mb-1 text-lg">Unlimited Searches</h3>
              <p className="text-xs text-muted-foreground mt-1">Upgrade to access all features</p>
            </div>
            <ul className="space-y-1 mb-4 text-sm">
              <li className="flex items-center">
                <Users className="w-3 h-3 mr-2 text-primary" />
                <span>Unlimited searches per month</span>
              </li>
              <li className="flex items-center">
                <Users className="w-3 h-3 mr-2 text-primary" />
                <span>Search across popular platforms</span>
              </li>
              <li className="flex items-center">
                <Building className="w-3 h-3 mr-2 text-primary" />
                <span>Custom domain crawling</span>
              </li>
              <li className="flex items-center">
                <Building className="w-3 h-3 mr-2 text-primary" />
                <span>Up to 50 results per search</span>
              </li>
              <li className="flex items-center">
                <Building className="w-3 h-3 mr-2 text-primary" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Button
              className="w-full text-sm py-1"
              onClick={handleUpgrade}
            >
              See Plans
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}