import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  
  export default function FAQ() {
    const faqs = [
      {
        question: "What is an AI-powered user finder?",
        answer: "An AI-powered user finder is a tool that uses artificial intelligence to discover target users and potential customers for your app. It analyzes data from various sources to identify individuals who are likely to be interested in your product."
      },
      {
        question: "How does UserFinder AI help with app promotion?",
        answer: "UserFinder AI helps with app promotion by providing targeted marketing solutions, social media insights, and a user acquisition platform. It allows you to find conversations about your app, connect with potential users, and maximize your app's visibility across various platforms."
      },
      {
        question: "Can UserFinder AI help me promote my fitness app?",
        answer: "UserFinder AI is excellent for promoting fitness apps. It can help you connect with fitness enthusiasts, find relevant conversations on platforms like Reddit, Quora, and Twitter, and provide insights to enhance your app's features based on user feedback."
      },
      {
        question: "How does the AI search engine for apps work?",
        answer: "Our AI search engine for apps crawls popular platforms to find conversations and posts related to your app or similar products. It uses natural language processing to understand context and user intent, helping you identify interested users and potential customers."
      },
      {
        question: "What kind of social media insights does UserFinder AI provide?",
        answer: "UserFinder AI provides audience engagement insights from various social media platforms. This includes data on user preferences, trending topics in your app's niche, and analysis of conversations about your app or similar products."
      },
    ]
  
    return (
      <section className="w-full py-3  lg:py-12 bg-white dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8 md:mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full text-left max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left " >{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    )
  }