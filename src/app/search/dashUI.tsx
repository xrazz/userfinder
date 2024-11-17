'use client'

import * as React from "react"
import { Search, Folder, Sparkles, HelpCircle, Info, Menu, LogOut, MessageSquareQuoteIcon, History, Command } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import Help from "./tabs/helpTab"
import HowTo from "./tabs/howToTab"
import { auth } from "../firebaseClient"
import Cookies from "js-cookie";
import SearchTab from "./tabs/search"
import BookmarksPage from "./tabs/bookmarksTab";
import TermsTab from "./tabs/termsTab"
import UpgradePage from "./tabs/upgrade"
import SearchHistoryPlotter from "./tabs/history"
import Image from "next/image"


// const MEMBERSHIP_LEVELS = {
//   FREE: 'Free',
//   BASIC: 'Basic',
//   PRO: 'Pro'
// };

interface DashboardProps {
  Membership: string;
  profileurl: string;
  profileName: string;
  profileEmail: string;
  uid: string;
}

export default function DashUI({ Membership, profileurl, profileName, profileEmail, uid }: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState('search')

  const handleSignOut = async () => {
    await auth.signOut();
    Cookies.remove("token");
    window.location.reload();
  };


  if (uid.trim() === '') {
    return (
      <div>
        <header className="flex h-16 bg-transparent  justify-between  px-4">
          <div className="flex items-center justify-evenly">
            <a href="/"> <Image src="/logo.svg" alt="UserFinder AI Logo" width={40} height={40} />
            </a>
          </div>
          <div className="flex items-center gap-2 justify-evenly">
            <a href="/login"> <Button variant="default" size="default">
              Sign Up
            </Button>
            </a>
            <a href="/login">
            <Button variant="outline" size="default">
            Login
            </Button>

            </a>
          </div>

        </header> <main className="flex-1 p-3 mt-16 sm:mt-30">
          <SearchTab membership={Membership} name={profileName} email={profileEmail} userId={uid} />
        </main></div>
    )
  }
  return (

    <SidebarProvider defaultOpen={false} >
      <Sidebar collapsible="icon" className="bg-black border-r border-gray-50">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="w-full justify-start">
                <img src="/logo.svg" alt="UserFinderAI Logo" className="h-8 w-8 shrink-0" />
                <span className="ml-2 text-lg font-semibold transition-opacity duration-200 group-[[data-collapsible=icon]]:opacity-0 group-[[data-collapsible=icon]]:invisible">
                  UserFinderAI
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Services</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('search')} isActive={activeTab === 'search'}>
                  <Search className="h-4 w-4 mr-2 shrink-0" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('bookmarks')} isActive={activeTab === 'bookmarks'}>
                  <Folder className="h-4 w-4 mr-2 shrink-0" />
                  <span>Bookmarks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('termstab')} isActive={activeTab === 'termstab'}>
                  <MessageSquareQuoteIcon className="h-4 w-4 mr-2 shrink-0" />
                  <span>Search Terms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('history')} isActive={activeTab === 'history'}>
                  <History className="h-4 w-4 mr-2 shrink-0" />
                  <span>History</span>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Upgrade</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('upgrade')} isActive={activeTab === 'upgrade'}>
                  <Sparkles className="h-4 w-4 mr-2 shrink-0" />
                  <span>Upgrade</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          {/* <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('help')} isActive={activeTab === 'help'}>
                  <HelpCircle className="h-4 w-4 mr-2 shrink-0" />
                  <span>Help Me</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveTab('howto')} isActive={activeTab === 'howto'}>
                  <Info className="h-4 w-4 mr-2 shrink-0" />
                  <span>How to Use</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup> */}
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter>

          <SidebarTrigger>
            <Button variant="outline" size="icon" >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="mr-1">
                  <AvatarImage src={profileurl} alt="User Profile" />
                  <AvatarFallback>{profileName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-64 ml-3 p-0 rounded-lg shadow-lg">
              <div className="p-4 rounded-t-lg">
                <div className="flex items-center ">
                  <Avatar className="w-12 h-12 border-2 border-white">
                    <AvatarImage src={profileurl} alt={profileName} />
                    <AvatarFallback>{profileName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium leading-tight">{profileName}</p>
                    <p className="text-xs leading-tight opacity-80">{profileEmail}</p>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full justify-center px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-primary"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 bg-transparent items-center justify-between border-none px-4">
          <div className="flex items-center">
            <SidebarTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SidebarTrigger>

          </div>

        </header>


        <main className="flex-1 p-3">
          {activeTab === 'search' && <SearchTab membership={Membership} name={profileName} email={profileEmail} userId={uid} />}
          {activeTab === 'bookmarks' && <BookmarksPage />}
          {activeTab === 'termstab' && <TermsTab />}
          {activeTab === 'upgrade' && <UpgradePage />}
          {activeTab === 'help' && <Help />}
          {activeTab === 'howto' && <HowTo />}
          {activeTab === 'history' && <SearchHistoryPlotter />}
        </main>
        {/* </AuroraBackground> */}

      </SidebarInset>
    </SidebarProvider>
  )
}