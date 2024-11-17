'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { motion } from "framer-motion"
import { Eye, MousePointerClick, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { CursorArrowIcon } from "@radix-ui/react-icons"

// Sample data for the graph
const initialData = [
  { month: "Jan", sales: 400 },
  { month: "Feb", sales: 600 },
  { month: "Mar", sales: 800 },
  { month: "Apr", sales: 1000 },
  { month: "May", sales: 900 },
  { month: "Jun", sales: 1100 },
]

export default function Component() {
  const [data, setData] = useState(initialData)
  const [views, setViews] = useState(1234)

  // Animate views count up
  useEffect(() => {
    const interval = setInterval(() => {
      setViews(prev => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Animate graph data
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev]
        newData.forEach(item => {
          item.sales = item.sales + Math.random() * 100
        })
        return [...newData]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div  className="p-4 max-w-4xl mb-16 mx-auto space-y-5">
      <div className="flex justify-center">
      <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200">
            Sales
          </Badge>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Turn Your Interactions to Sales</h1>
          <div className="space-y-4">
            <Card className="bg-gray-100 border-none shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Latest Conversations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Lillian", image:'https://i.redd.it/snoovatar/avatars/2c608c18-d6d4-4d60-9381-1d79b55f3cc1.png',role: "Marketing", message: "What’s the best work out/exercise app you use?" },
                  { name: "Fredino", image:'https://i.redd.it/snoovatar/avatars/c464288b-006e-4a00-80f8-d4d9e9de39f6.png', role: "Sales", message: "What are the best tools you have used in Digital Marketing?" },
                  { name: "Rohit", image:"https://i.redd.it/snoovatar/avatars/5e28bf18-7cef-41d1-973d-90d5cfec259f.png",role: "Customer Support", message: "What's a better Notion alternative?" },
                  { name: "Fabio",image:"https://i.redd.it/snoovatar/avatars/d8510627-4560-44eb-872c-c164334e91eb.png", role: "Product Development", message: "What is the best AI image generator to start with?" }
                ].map((conversation, index) => (
                  <div key={index} className="flex items-start space-x-3 border rounded-lg p-3 bg-white">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`${conversation.image}`} alt={conversation.name} />
                      <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{conversation.name}  </div>
                      <p className="text-xs text-muted-foreground">{conversation.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="relative">
          <Card className="h-full bg-gray-100 border-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Sales Growth</CardTitle>
            </CardHeader>
            <CardContent>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="h-[300px] sm:h-[400px] lg:h-[300px] -mx-4 sm:mx-0"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFC0CB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FFC0CB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#FF69B4"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Badge variant="secondary" className="text-sm px-3 py-1 flex items-center gap-1">
              <CursorArrowIcon className="w-3 h-3" />
              {views.toLocaleString()} Visits
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}