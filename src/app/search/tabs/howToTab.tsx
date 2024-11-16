import React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import DemoVideo from "@/components/ui/demoVideo"

const HowTo = () => {
  return (
    <main className="flex-grow p-4 flex flex-col items-center">
      {/* Video Placeholder */}
     
        
          <DemoVideo/>
     

      {/* FAQ Section */}
      <div className="w-full max-w-[80vw] lg:max-w-[60vw]">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>What does this app do?</AccordionTrigger>
            <AccordionContent>
              This app helps you discover customer needs and trends by crawling top forums and social media platforms like Reddit, Twitter, Quora, and Hacker News. You can either validate your market by seeing what people are talking about or introduce your product directly to potential customers who are already seeking solutions.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How do I use the app?</AccordionTrigger>
            <AccordionContent>
              Simply enter a query related to your target audience or product idea, like &#34;People looking for fitness apps.&#34; The AI crawler will search relevant posts and conversations across platforms, giving you real-time insights on what people are looking for and how to engage with them.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Which platforms do you crawl?</AccordionTrigger>
            <AccordionContent>
              We crawl Reddit, Twitter, Quora, and Hacker News to gather discussions, posts, and conversations relevant to your query.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Can I introduce my product directly to potential customers?</AccordionTrigger>
            <AccordionContent>
              Yes! Once the app finds relevant discussions, you can engage with people who are actively seeking solutions and introduce your product directly on the platforms they use.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>How does market validation work?</AccordionTrigger>
            <AccordionContent>
              Market validation is simple. Based on the posts and discussions found, you can gauge what problems people are experiencing and how much they are willing to pay for a solution. This allows you to refine your product and strategy before launching.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>Do I need a product ready to use the app?</AccordionTrigger>
            <AccordionContent>
              No, you don’t need a ready product. The app is perfect for discovering customer needs and validating your idea before building anything. However, if you do have a product, you can use it to introduce your solution directly to potential customers.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>How accurate are the insights?</AccordionTrigger>
            <AccordionContent>
              The insights come from real conversations happening in top forums and social media. You’re essentially getting direct feedback from potential customers, making the insights highly relevant to your query.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>Can I customize my query?</AccordionTrigger>
            <AccordionContent>
              Yes, you can customize your query to match your specific niche or target audience. For example, you can search for &#34;people struggling with productivity apps&#34; or &#34;small businesses needing accounting tools.&#34; The crawler will return results based on the query you provide.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger>How does this app help me get customers?</AccordionTrigger>
            <AccordionContent>
              By finding people who are actively discussing their problems, your product can be introduced at the perfect time—when they are looking for solutions. You can engage directly with these potential customers through targeted posts.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger>Is there a limit to how many queries I can make?</AccordionTrigger>
            <AccordionContent>
              With the Free Plan, you can make up to 2 queries per day. For unlimited queries, you can upgrade to the Paid Plan, which costs just $10 per day.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11">
            <AccordionTrigger>Is this app suitable for all types of businesses?</AccordionTrigger>
            <AccordionContent>
              Yes! Whether you’re launching a tech product, a service, or even a physical good, the app helps you identify what your potential customers are talking about and how they are expressing their needs.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  )
}

export default HowTo
