import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Globe, Filter, UserPlus, TrendingUp as TrendingUpIcon, DollarSign } from "lucide-react"

export default function HowItWorks() {
  const howItWorksSteps = [
    { icon: Send, title: "Submit Your Query", description: "Enter a query like, \"People looking for fitness apps,\" and let our AI crawler get to work!" },
    { icon: Globe, title: "Crawl Top Platforms", description: "We search Reddit, Quora, Twitter, and more to find conversations about your app." },
    { icon: Filter, title: "Relevant Results", description: "Instantly see posts where people discuss their needs related to your app." },
    { icon: UserPlus, title: "Introduce Your Product", description: "Connect with fitness enthusiasts and promote your fitness app directly." },
    { icon: TrendingUpIcon, title: "Market Validation", description: "Get user feedback and insights to refine your app offering." },
    { icon: DollarSign, title: "Get Customers Directly", description: "Convert interested users into customers for your app." },
  ]

  return (
    <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-center mb-12 md:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300">
          How It Works
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <Card key={index} className="w-full h-full transition-all duration-300 hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 group">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 text-primary rounded-full p-3 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}