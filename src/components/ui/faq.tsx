import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "./badge"

export default function Component() {
  const faqs = [
    {
      question: "What exactly does userfinder.ai do?",
      answer: "Userfinder.ai is an AI-powered search tool designed to help you discover potential users by finding real-time conversations about your niche. It crawls platforms like Reddit, Twitter, Quora, Stack Exchange, and even custom domains, identifying discussions where people are actively looking for products or solutions like yours. This makes it easier to introduce your product to the right audience and engage with them effectively."
    },
    {
      question: "How can userfinder.ai help me get early users or customers?",
      answer: "With userfinder.ai, you can set date filters to find conversations posted within the last 24 hours. This lets you quickly identify real-time discussions where people are actively seeking solutions like yours. You can jump into these conversations to introduce your product, helping you acquire early users faster and build traction for your brand."
    },
    {
      question: "Why should I use userfinder.ai instead of manually searching on platforms like Google, Reddit, or Quora?",
      answer: "Manually searching on platforms like Google, Reddit, Twitter, and Quora can be time-consuming and often frustrating. These platforms usually show years-old, inactive discussions still topping the results, which aren't useful if you're looking to find active conversations or potential users. Userfinder.ai automates this process, crawling multiple platforms simultaneously and using AI to surface only fresh, highly relevant conversations. This saves you time and effort, allowing you to engage with users who are currently talking about topics related to your niche."
    },
    {
      question: "Why should I pay $29 when I can search on these platforms for free?",
      answer: "While you can manually search on these platforms for free, those searches often bring up outdated results. For example, platforms like Google or Reddit may show you discussions that are years old and no longer relevant, making it difficult to find current conversations where people are actively looking for solutions. Userfinder.ai solves this by providing up-to-date, targeted results with advanced filters. For $10, you get unlimited searches on popular platforms, and for $29, you can crawl custom domains, allowing you to find niche conversations that are happening right now. This investment saves you hours of manual effort and helps you connect with potential users more effectively."
    },
    {
      question: "Can I search custom domains with userfinder.ai?",
      answer: "Yes! The $29 plan allows you to crawl custom domains like Facebook, LinkedIn, or any specific website. This is perfect for niche targeting, enabling you to discover conversations relevant to your industry or product, beyond the standard platforms."
    },
    {
      question: "What are the pricing plans and features?",
      answer: "We offer two pricing plans: a $10 plan with unlimited searches per month across supported platforms like Reddit, Twitter, and Quora, and a $29 plan that includes crawling custom domains. Both plans allow up to 100 results per search, helping you find the most relevant discussions efficiently."
    },
    {
      question: "Is userfinder.ai live now?",
      answer: "Not yet! We previously launched a free version and acquired 50 users in just 2 days. However, we're currently refining the platform based on user feedback and plan to relaunch soon with updated pricing and features."
    },
    {
      question: "How can userfinder.ai benefit SaaS startups or indie developers?",
      answer: "Userfinder.ai is perfect for SaaS startups and indie developers looking to validate their ideas or find early adopters. By uncovering conversations where people are actively looking for solutions, you can introduce your product at the right moment and convert interest into users."
    },
    {
      question: "I'm just starting out and don't have a big budget. Is userfinder.ai suitable for me?",
      answer: "Absolutely! As someone who’s also starting out, I understand the need for affordable solutions. That’s why the basic plan is just $10/month for unlimited searches, making it accessible for startups and solo entrepreneurs looking to grow their user base without breaking the bank."
    },
    {
      question: "How do you use userfinder.ai to promote your own product?",
      answer: "I use userfinder.ai to find recent conversations where people are discussing problems related to my niche. By jumping into those discussions and introducing my product, I managed to get 50 users within 2 days on my MVP. It’s an effective way to get direct feedback and acquire early users."
    }
  ];
  
 
  

  return (
    // <div className="container mx-auto px-4 py-12 mb-14 w-full md:w-2/3">
      // <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
      //       How it works
      //     </Badge>
    //   <h1 className="text-3xl font-bold mb-8">Questions & answers</h1>
      // <Accordion type="single" collapsible className="w-full">
      //   {faqs.map((faq, index) => (
      //     <AccordionItem
      //       key={index}
      //       value={`item-${index}`}
      //       className=" border-b last:border-b-0"
      //     >
      //       <AccordionTrigger className="flex justify-between items-center w-full text-left text-base font-medium hover:no-underline [&[data-state=open]>div]:rotate-180">
      //         {faq.question}

      //       </AccordionTrigger>
      //       <AccordionContent className="text-muted-foreground pt-4 overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
      //         {faq.answer}
      //       </AccordionContent>
      //     </AccordionItem>
      //   ))}
      // </Accordion>
    // </div>

    <div className="container mx-auto px-4 py-12 mb-14 w-full md:max-w-4xl">
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
            FAQ
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Questions & answers</h1>
        {/* <p className="text-gray-500 text-sm dark:text-gray-400 max-w-2xl">
          We’ve got flexible pricing plans to suit your needs find the perfect one and get started with everything you love!
        </p> */}


      </div>

       
      <Accordion type="single" collapsible className="w-full mt-6">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className=" border-b last:border-b-0"
          >
            <AccordionTrigger className="flex justify-between items-center w-full text-left text-base font-medium hover:no-underline [&[data-state=open]>div]:rotate-180">
              {faq.question}

            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-4 overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}