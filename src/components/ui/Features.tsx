// import { Search, Share2, BarChart3, Users, Megaphone, Target } from "lucide-react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"

// export default function Component() {
//   const features = [
//     { 
//       title: "Find Targeted Users",
//       description: "Find your target users with advanced AI",
//       icon: Search
//     },
//     { 
//       title: "Social Insights",
//       description: "Gain valuable audience engagement data",
//       icon: Share2
//     },
//     { 
//       title: "Market Research",
//       description: "Analyze competitors and refine strategies",
//       icon: BarChart3
//     },
//     { 
//       title: "User Acquisition",
//       description: "Connect with potential customers easily",
//       icon: Users
//     },
//     { 
//       title: "App Promotion",
//       description: "Boost your app's visibility effectively",
//       icon: Megaphone
//     },
//     { 
//       title: "Targeted Marketing",
//       description: "Reach your ideal users precisely",
//       icon: Target
//     }
//   ]

//   return (
//     <div className="w-full pb-12 pt-8 md:py-24 lg:py-32">
//       <div className="container px-4 md:px-6">
//         <div className="relative w-full max-w-6xl mx-auto">
//           <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-lg bg-black transition-colors duration-300  hidden md:block" />
//           <Card className="relative w-full overflow-hidden rounded-lg border border-primary/20">
//             <CardHeader className="text-center pb-2">
//               <div className="flex justify-center mb-4">
//                 <Badge variant="secondary" className="text-sm font-medium">
//                   Features
//                 </Badge>
//               </div>
//               <CardTitle className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
//                 Why Choose UserFinder AI?
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                 {features.map((feature, index) => {
//                   const Icon = feature.icon
//                   return (
//                     <div 
//                       key={index}
//                       className="flex flex-col items-center text-center p-4"
//                     >
//                       <div className="p-3 rounded-full bg-primary text-primary-foreground mb-4">
//                         <Icon className="w-6 h-6" />
//                       </div>
//                       <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
//                       <p className="text-sm text-muted-foreground">{feature.description}</p>
//                     </div>
//                   )
//                 })}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }




// 'use client'

// import { Card } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Badge } from "@/components/ui/badge"
// import { ChevronDown, Inbox, Mail, PenSquare, Send } from "lucide-react"
// import { useState } from "react"

// export default function Component() {
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   return (
//     <div className="w-full max-w-6xl mx-auto px-4 py-8">
//       <div className="mb-8 text-center">
//         <Badge variant="secondary" className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
//           Features
//         </Badge>
//         <h1 className="text-3xl font-bold tracking-tight mb-4">A place to get things done</h1>
//         <p className="text-base text-muted-foreground max-w-2xl mx-auto">
//           Whether you&apos;re supporting customers or catching up on newsletters, create views that show what&apos;s important
//           right now.
//         </p>
//       </div>

//       <Card className="border rounded-lg overflow-hidden bg-white">
//         <div className="flex flex-col md:flex-row h-[600px]">
//           <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 border-b md:border-b-0 md:border-r p-4 flex-shrink-0`}>
//             <div className="flex flex-col gap-1">
//               <button className="flex items-center gap-2 p-2 text-sm hover:bg-gray-100 rounded-md">
//                 <Mail className="h-4 w-4" />
//                 <span>Mail</span>
//               </button>
//               <button className="flex items-center gap-2 p-2 text-sm hover:bg-gray-100 rounded-md">
//                 <Inbox className="h-4 w-4" />
//                 <span>Inbox</span>
//               </button>
//               <button className="flex items-center gap-2 p-2 text-sm hover:bg-gray-100 rounded-md">
//                 <Send className="h-4 w-4" />
//                 <span>Sent</span>
//               </button>
//               <button className="flex items-center gap-2 p-2 text-sm hover:bg-gray-100 rounded-md">
//                 <PenSquare className="h-4 w-4" />
//                 <span>Drafts</span>
//               </button>
//             </div>
//           </div>
//           <ScrollArea className="flex-1">
//             <div className="p-4">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
//                     <ChevronDown className="h-6 w-6" />
//                   </button>
//                   <Badge variant="secondary" className="bg-pink-100 text-pink-700">
//                     Recruiting
//                   </Badge>
//                 </div>
//                 <div className="flex gap-2">
//                   <button className="text-sm text-muted-foreground hover:text-foreground">Groups</button>
//                   <button className="text-sm text-muted-foreground hover:text-foreground">Filter</button>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 {['Next steps', 'Offer letter', 'Tomorrow\'s Schedule'].map((item, index) => (
//                   <div key={index} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2">
//                     <div className="flex items-center gap-2">
//                       <ChevronDown className="h-4 w-4" />
//                       <span className="font-medium">{item}</span>
//                     </div>
//                     <div className="flex gap-2">
//                       <Badge variant="secondary" className={`bg-${index === 0 ? 'blue' : 'green'}-100 text-${index === 0 ? 'blue' : 'green'}-700`}>
//                         {index === 0 ? 'Onsite' : 'Offer'}
//                       </Badge>
//                       <Badge variant="secondary" className={`bg-${index === 0 ? 'purple' : 'orange'}-100 text-${index === 0 ? 'purple' : 'orange'}-700`}>
//                         {index === 0 ? 'Growth' : 'Backend'}
//                       </Badge>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </ScrollArea>
//         </div>
//       </Card>
//     </div>
//   )
// }


 
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, MessageSquare, Banknote } from "lucide-react"

export default function Component() {
  return (
    <div id='growth'  className="container mx-auto px-4 py-12 mb-14 w-full md:max-w-4xl">
      <div className="flex justify-center mb-8">
        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
          Example
        </Badge>
      </div>
      <div className="grid md:grid-cols-[2fr,3fr] gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-10">
          <div>
            <h1 className=" text-2xl font-bold tracking-tight md:text-3xl">
              Find users with ease.
            </h1>
          </div>

          <div className="space-y-8">
            {[
              { icon: Search, title: "Search for your niche", description: '"need a fitness app for gym/workout"' },
              { icon: Users, title: "Find targeted users", description: `"I'm looking for a fitness app that tracks workouts and calories. Any suggestions?"` },
              { icon: MessageSquare, title: "Introduce your product", description: '"Yes! I have an app that does exactly that' },
              { icon: Banknote, title: "Get your perfect paying users", description: '"Thanks! Sounds perfect I’ll give it a try!"' }
            ].map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg ${index === 0 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <feature.icon className={`w-5 h-5 ${index === 0 ? 'text-purple-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="space-y-5">
            {[
              { avatar: "https://i.redd.it/snoovatar/avatars/nftv2_bmZ0X2VpcDE1NToxMzdfYmZkNjcwNjY3MDUzZTUxN2E5N2FmZTU2YzkxZTRmODNmMTE2MGJkM180NDU1NQ_rare_864befbe-be7b-4955-8bb1-c5cbb0f70bf0.png", message: "What's the best automated workout app?." },
              { avatar: "https://i.redd.it/snoovatar/avatars/9c3446be-ebc8-4905-95da-36e45f722ea7.png", message: "I really need an app with some tracking features for my gym. Im ready to pay for a perfect solution", showButton: true },
              { avatar: "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_3.png", message: "Hey i have an app with all features you need!" },
              { avatar: "https://i.redd.it/snoovatar/avatars/9c3446be-ebc8-4905-95da-36e45f722ea7.png", message: "Wow its an amazing app thanks for sharing" }
            ].map((chat, index) => (
              <div key={index} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.avatar.charAt(chat.avatar.length - 5).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-gray-600 text-xs">{chat.message}</p>
                  </div>
                  {/* {chat.showButton && (
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">Engage</Button>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}