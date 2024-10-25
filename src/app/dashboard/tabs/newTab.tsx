import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const pricingPlans = [
  {
    title: "Basic Plan",
    price: "$10",
    features: [
      {
        heading: "Custom Search Date Range",
        description: "Filter your search results by specific date ranges to focus on recent discussions or target particular time frames relevant to your research.",
      },
      {
        heading: "Control the Number of Queries",
        description: "Decide how many results you want to fetch per query, giving you greater control over your search volume and the data you receive.",
      },
    ],
  },
  {
    title: "Pro Plan",
    price: "$30",
    features: [
      {
        heading: "Page Summarization",
        description: "Summarize entire pages with just one click. Extract key discussion points from your search results, saving you time and helping you understand trends quickly. You can also save these summaries for future reference.",
      },
      {
        heading: "Custom Sites to Crawl",
        description: "Add your own custom websites for our AI 'CurvSpider Crawler' to search, enabling you to gather insights from specific industry sites or niche platforms.",
      },
    ],
  },
  {
    title: "Advanced Plan",
    price: "$100",
    features: [
      {
        heading: "AI Advertising Plan",
        description: "Target your audience effectively with our AI advertising feature. For every $100, you'll get up to 1,000 user visits to your site through your URL, generating at least 300+ leads from a highly accurate targeted audience.",
      },
      {
        heading: "URL Tracking & Visualization Tool",
        description: "This plan includes a tool that tracks your URL and leads, providing visualizations of the data, so you can see the performance and impact of your advertising efforts.",
      },
    ],
  },
]

export default function New() {
  return (
    <div className="bg-gradient-to-b  min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Upcoming Features & Pricing Plans
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your needs and unlock powerful features
          </p>
        </div>
        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <CardDescription>
                  <span className="text-4xl  text-gray-800 font-extrabold">{plan.price}</span>
                  <span className="text-base font-medium text-gray-800">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-gray-900">{feature.heading}</h4>
                        <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}