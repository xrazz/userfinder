"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BellIcon,
  FolderIcon,
  Phone,
  SearchIcon,
  CircleHelp,
  Menu,
  Crown,
  Sparkles,
} from "lucide-react";
import SearchTab from "./tabs/search";
import BookmarksPage from "./tabs/bookmarksTab";
import Help from "./tabs/helpTab";
import HowTo from "./tabs/howToTab";
import New from "./tabs/newTab";
import { auth } from "../firebaseClient";
import Cookies from "js-cookie";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export type IconProps = React.HTMLAttributes<SVGElement>;

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const NavItem = React.memo(({ icon: Icon, label, onClick, isActive }: NavItemProps) => (
<TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={isActive ? "text-primary" : "text-muted-foreground"}
          aria-label={label}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="z-50">
        {label}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

const navItems = [
  { icon: SearchIcon, label: "Search", key: "search" },
  { icon: FolderIcon, label: "Bookmarks", key: "folder" },
  { icon: Phone, label: "Help", key: "phone" },
  { icon: CircleHelp, label: "How To", key: "help" },
  { icon: BellIcon, label: "Notifications", key: "bell" },
];

interface DashboardUIProps {
  isPremium: boolean;
  profileurl: string;
  profileName: string;
  profileEmail: string;
  uid: string;
}

const PremiumButton = ({ isPremium, handleGetPremium }: { isPremium: boolean, handleGetPremium: () => void }) => (
  <Button
    onClick={isPremium ? undefined : handleGetPremium}
    className="hidden sm:inline-flex items-center w-48 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl relative overflow-hidden group"
  >
    {isPremium ? (
      <>
        <Crown className="w-5 h-5 mr-2 animate-pulse" />
        <span>Pro Member</span>
      </>
    ) : (
      <>
        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
        <span>Upgrade to Pro</span>
      </>
    )}
  </Button>
);

type TabKey = 'search' | 'folder' | 'phone' | 'help' | 'bell'; // Define valid tab keys

export default function Component({
  isPremium,
  profileurl,
  profileName,
  profileEmail,
  uid,
}: DashboardUIProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return "search";
  });

 

  const handleTabClick = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const handleGetPremium = () => {
    window.location.href = "/checkout";
  };

  const handleSignOut = async () => {
    await auth.signOut();
    Cookies.remove("token");
    window.location.reload();
  };

  const tabComponents = useMemo(() => ({
    search: <SearchTab PremiumCheck={isPremium} name={profileName} userId={uid} />,
    folder: <BookmarksPage userId={uid} />,
    phone: <Help />,
    help: <HowTo />,
    bell: <New />,
  }), [isPremium, profileName, uid]);

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col items-center w-16 py-4 space-y-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border/40">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={32} height={32} className="mb-4" />
        {navItems.map((item) => (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            onClick={() => handleTabClick(item.key as TabKey)}
            isActive={activeTab === item.key}
          />
        ))}
        <div className="flex-grow" />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border/40">
          <div className="mx-auto px-1 sm:px-1 lg:px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                    <nav className="flex flex-col space-y-4">
                      {navItems.map((item) => (
                        <Button
                          key={item.key}
                          variant="ghost"
                          className={`justify-start ${activeTab === item.key ? "text-primary" : "text-muted-foreground"}`}
                          onClick={() => handleTabClick(item.key as TabKey)}
                        >
                          <item.icon className="h-5 w-5 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
                <span className="text-lg font-semibold ml-0">UserFinder AI</span>
              </div>
              <div className="flex items-center space-x-4">
                <PremiumButton isPremium={isPremium} handleGetPremium={handleGetPremium} />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="mt-auto">
                      <Avatar className="mr-2">
                        <AvatarImage src={profileurl} alt="User Profile"  />
                        <AvatarFallback>{profileName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 mt-3 p-0 rounded-lg shadow-lg">
  <div className="    p-4 rounded-t-lg">
    <div className="flex items-center gap-3">
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
      {/* <LogOut className="w-4 h-4 mr-2" /> */}
      Sign Out
    </Button>
  </div>
</PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        <main className="flex-1 p-4 overflow-auto">
          {tabComponents[activeTab] || <SearchTab PremiumCheck={isPremium} name={profileName} userId={uid} />}
        </main>
      </div>
    </div>
  );
}
