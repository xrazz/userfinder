// import React from 'react'

"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tabs } from "@radix-ui/themes"
import { MessageSquare, Bookmark, SearchIcon, SlidersHorizontalIcon, RocketIcon, Smile, LinkIcon, Check, Sparkles, BookmarkIcon, HeadphonesIcon, ZapIcon, AlertCircle, X } from 'lucide-react'
import { TabsContent } from '@radix-ui/react-tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { toast, Toaster } from "sonner"
import { createGoogleDork } from '../dorkingQuery'
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import SearchLoader from './tabsui/searchProgressUI'
import { Separator } from '@/components/ui/separator'


import { db } from '@/app/firebaseClient'
 


enum DateFilter {
  Latest = 'last 2 months',
  Oldest = 'last 2 years',
  Lifetime = 'no date filter'
}
interface Post {
  title: string
  link: string
}
const SearchTab = ({ PremiumCheck, name, userId }: { PremiumCheck: boolean, name: string, userId: string }) => {

  const [searchQuery, setSearchQuery] = useState('')
  const [queryToSend, setQueryToSend] = useState('')
  const [currentFilter, setCurrentFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(false);
  const [redditData, setRedditData] = useState<Post[]>([]);
  const [xData, setXData] = useState<Post[]>([]);
  const [quoraData, setQuoraData] = useState<Post[]>([]);
  const [hnData, setHnData] = useState<Post[]>([]);
  const [devData, setDevData] = useState<Post[]>([]);
  const [isPremium, setIsPremium] = useState(false)
  const [credits, setCredits] = useState(0)
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)

  useEffect(() => {
    console.log('Username has changed:', name);
    // Add any other actions you want to take when the username changes
  }, [name]);

  useEffect(() => {
    // Check if any data list has been filled, indicating data is ready to display
    if (
      redditData.length > 0 ||
      xData.length > 0 ||
      quoraData.length > 0 ||
      hnData.length > 0 ||
      devData.length > 0
    ) {
      console.log('data is there')
      setLoading(false);  // Stop loading when data is ready
    }


  }, [redditData, xData, quoraData, hnData, devData]);

  useEffect(() => {
    fetchUserData()
  }, [userId])

  useEffect(() => {
    if (credits === 0 && !PremiumCheck) {
      setShowPremiumDialog(true)
    } else {
      setShowPremiumDialog(false)
    }
  }, [credits, PremiumCheck])
  const fetchUserData = async () => {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      setIsPremium(userData.isPremium || false)
      setCredits(userData.credits || 0)
    }
  }

  const updateCredits = async () => {
    if (!isPremium && credits > 0) {
      const newCredits = credits - 1
      await updateDoc(doc(db, 'users', userId), { credits: newCredits })
      setCredits(newCredits)
    }
  }

  const handleDisabledClick = () => {
    console.log("here")
    if (!PremiumCheck && credits <= 0) {
      setShowPremiumDialog(true)
    }
  }
  const fetchResult = async (query: string,): Promise<any[]> => {


    try {
      const responseForReddit = await fetch('/api/searchApify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      });

      const data = await responseForReddit.json();
      const resultData = data.data;

      if (data.success) {
        // setLoading(true);
        return resultData;  // Return the result data here
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err: any) {
      console.log(err.message);
      return [];  // Return an empty array in case of an error
    } finally {
      // setLoading(false);  // Stop loading
    }
  };



  const handleSearch = async () => {
    const dateFilter = mapFilterToDate(currentFilter);
    if (!PremiumCheck && credits <= 0) {
      setShowPremiumDialog(true)
      return
    }
    // Clear old data before fetching new ones
    setRedditData([]);
    setXData([]);
    setQuoraData([]);
    setHnData([]);
    setDevData([]);

    setLoading(true); // Start loading
    try {
      const [redditResults, xResults, quoraResults, ihResults, devResults] = await Promise.all([
        fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'reddit.com')),
        fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'x.com')),
        fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'quora.com')),
        fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'news.ycombinator.com')),
        fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'dev.to')),
      ]);

      // Set data to state
      setRedditData(redditResults);
      setXData(xResults);
      setQuoraData(quoraResults);
      setHnData(ihResults);
      setDevData(devResults);

      // Ensure the data is in the state before hiding the loader
      // Stop loading only after setting the data
      await updateCredits()
      setQueryToSend(searchQuery);
      // setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);  // Stop loading in case of error
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (searchQuery.trim() === '') {
        // setError('Query cannot be empty')
        // Prevent submitting and show an error message (optional)

        return;
      }
      handleSearch()
    }
  }
  const handleFilterChange = (value: string) => {
    setCurrentFilter(value)
    setIsFilterOpen(false)
  }
  const decodeUrl = (encodedUrl: string): string => {
    return decodeURIComponent(encodedUrl);
  };

  const mapFilterToDate = (filter: string) => {
    switch (filter) {
      case 'newest':
        return DateFilter.Latest;
      case 'oldest':
        return DateFilter.Oldest;
      case 'lifetime':
        return DateFilter.Lifetime;
      default:
        return DateFilter.Lifetime;
    }
  };

  const handleBookmark = async (post: Post) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        bookmarks: arrayUnion({
          title: post.title,
          url: post.link,
          createdAt: new Date()
        })
      })
      toast.success("Added to bookmarks", {
        description: `Bookmarked: ${post.title}`,
      })
    } catch (error) {
      console.error("Error adding bookmark:", error)
      toast.error("Failed to add bookmark", {
        description: "An error occurred while adding the bookmark.",
      })
    }
  }


  const handleGetPremium = () => {
    window.location.href = '/checkout';
  };
  const TabData = ({ platform, posts, logo }: { platform: string, posts: Post[], logo: string }) => {

    const handleEngage = (link: string) => {
      window.open(decodeUrl(link), '_blank');
    };

    const handleCopyUrl = (link: string) => {
      navigator.clipboard.writeText(decodeUrl(link)).then(() => {
        console.log("The URL is copied");
        toast("URL has been copied", {
          action: {
            label: "OK",
            onClick: () => console.log("Undo"),
          },
        });
      }).catch((err) => {
        console.error('Failed to copy: ', err);
        toast("Failed to copy URL", {
          description: "An error occurred while copying the URL.",
        });
      });
    };

    return (
      <div className="space-y-4 mx-auto p-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center">
            <Image
              src='/nothing.svg'
              alt="No results"
              width={150}
              height={150}
              className="mb-4"
            />
            <span className="text-muted-foreground">Seems like this hasn’t caught people’s attention just yet.</span>
          </div>
        ) : (
          posts.slice(2).map((post, index) => (  // Use slice to skip the first 2 posts
            <div key={index}>
              <div className="flex items-start space-x-3">
                <Image
                  src={logo}
                  alt={`${platform} Logo`}
                  width={20}
                  height={20}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{platform}</span>
                    <span className="text-sm text-muted-foreground">{currentFilter}</span>
                  </div>
                  <h2 className="text-lg font-semibold mt-1">
                    <a href={decodeUrl(post.link)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {post.title}
                    </a>
                  </h2>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-muted-foreground hover:bg-secondary" onClick={() => handleEngage(post.link)}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Engage
                      </Button>
                      <Button variant="outline" size="sm" className="text-muted-foreground hover:bg-secondary" onClick={() => handleCopyUrl(post.link)}>
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button variant="outline" size="sm" className="text-muted-foreground hover:bg-secondary" onClick={() => handleBookmark(post)}>
                        <Bookmark className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {index < posts.length - 3 && <Separator className="my-4" />} {/* Adjust the separator logic */}
            </div>
          ))
        )}
      </div>
    );
  };


  return (
    <main className="flex-grow flex items-start justify-center ">
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
      linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)
    `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, white 30%, transparent 80%)'
        }}
      />



      <Toaster position="bottom-center" />
      <div className='w-full max-w-3xl mx-auto space-y-4 relative z-100'>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hello, {name}</h1>
          {/* <p className="  text-gray-500">Get Started By Searching "people looking for note taking apps"?</p> */}
          {/* <p className="  text-gray-500">you have 2 credits left</p> */}
        </div>
        {PremiumCheck ? (
          <div />
        ) : (
          <Alert>
            <RocketIcon className="h-4 w-4" />
            <AlertTitle>{credits} credits left</AlertTitle>
            <AlertDescription>
              Each search costs 1 credit. <span className='font-medium cursor-pointer text-blue-600 underline' onClick={handleGetPremium} >Get premium for unlimited searches!</span>
            </AlertDescription>
          </Alert>
        )}


        <div className="flex items-center w-full space-x-2" onClick={() => handleDisabledClick()}>
          <div className="relative flex-grow"  >

            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
            <Input
              type="text"
              placeholder="Search your query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-14 py-2 w-full h-11 font-medium bg-gray-100 border-gray-100 shadow-none"

              // disabled={true}
              disabled={!isPremium && credits <= 0}

            />

            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 bg-transparent hover:bg-gray-100 text-gray-500"
                  >
                    <SlidersHorizontalIcon className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter by</h4>
                    <RadioGroup value={currentFilter} onValueChange={handleFilterChange}>
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

                </PopoverContent>
              </Popover>
            </div>


          </div>

        </div>
        {currentFilter && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Badge variant='secondary'  >{currentFilter}</Badge>
          </div>
        )}


        {loading && (<SearchLoader />)}
        {queryToSend && (
          <Tabs.Root defaultValue="reddit">
            <Tabs.List size="1" color="gray" highContrast>
              <Tabs.Trigger value="reddit">Reddit</Tabs.Trigger>
              <Tabs.Trigger value="twitter">Twitter</Tabs.Trigger>
              <Tabs.Trigger value="quora">Quora</Tabs.Trigger>
              <Tabs.Trigger value="hn">HN</Tabs.Trigger>
              <Tabs.Trigger value="dev">Dev.To</Tabs.Trigger>
            </Tabs.List>
            <TabsContent value="reddit">
              <TabData platform="Reddit" posts={redditData} logo='/reddit.svg' />
            </TabsContent>
            <TabsContent value="twitter">
              <TabData platform="Twitter" posts={xData} logo='/twitter.svg' />
            </TabsContent>
            <TabsContent value="quora">
              <TabData platform="Quora" posts={quoraData} logo='/quora.svg' />
            </TabsContent>
            <TabsContent value="hn">
              <TabData platform="Hacker News" posts={hnData} logo='/y-combinator.svg' />
            </TabsContent>
            <TabsContent value="dev">
              <TabData platform="Dev to" posts={devData} logo='/dev.svg' />
            </TabsContent>
          </Tabs.Root>
        )}



      </div>
      <AlertDialog open={showPremiumDialog && !PremiumCheck} onOpenChange={setShowPremiumDialog}>
        <AlertDialogContent className="max-w-[400px] rounded-lg p-0 overflow-hidden">
          <div className="flex justify-between items-start p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 rounded-full p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogHeader className="space-y-1">
                <AlertDialogTitle className="text-xl text-left font-semibold">Upgrade To Premium</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-left text-gray-500">
                  You've reached your search limit! Upgrade to Premium for unlimited searches and unlock access to all features. Don't miss out go premium and keep exploring without limits!
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            {/* <AlertDialogCancel className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </AlertDialogCancel> */}
          </div>
          <AlertDialogFooter className="flex  p-4 bg-gray-50">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="w-full">Later</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>

              <Button variant="destructive" className="w-full" onClick={handleGetPremium}>
                <Sparkles className="w-5 h-5 mr-2" />

                Get Pro</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default SearchTab
