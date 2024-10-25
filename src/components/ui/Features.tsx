export default function Features() {
    const features = [
      { 
        title: "AI-Powered User Finder", 
        description: "Discover target users and find potential customers with our advanced AI search engine for apps. Our tool helps you identify interested users and enhance user discovery."
      },
      { 
        title: "Social Media Insights", 
        description: "Gain valuable audience engagement insights and connect with your audience effectively. Target users on Reddit, Quora, Twitter, and other platforms to maximize app visibility."
      },
      { 
        title: "Market Research Tool", 
        description: "Use our targeted marketing solutions and competitive analysis tool to promote your app effectively. Get user feedback and insights to refine your app promotion strategy."
      },
      { 
        title: "User Acquisition Platform", 
        description: "Engage with potential customers and find your app users through our user acquisition platform. Bookmark user conversations and connect with fitness enthusiasts or any target audience."
      },
      { 
        title: "App Promotion Tool", 
        description: "Promote your fitness app or any other application with our comprehensive app promotion tool. Find conversations about your app and increase its visibility in the market."
      },
      { 
        title: "Targeted Marketing Solutions", 
        description: "Leverage our targeted marketing solutions to reach your ideal users. Our search engine for app users helps you find and engage with the right audience for your product."
      }
    ]
  
    return (
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-black text-white rounded-3xl border border-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8 md:mb-12">
            Why Choose UserFinder AI?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }