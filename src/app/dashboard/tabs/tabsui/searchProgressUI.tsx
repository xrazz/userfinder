import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

const steps = [
  "Initializing application",
  "Checking system requirements",
  "Preparing resources",
  "Configuring settings",
  "Optimizing performance",
  "Loading user data",
  "Establishing secure connection",
  "Finalizing setup",
  "Finalizing setup",
  "Finalizing setup",
  "Finalizing setup",
  "Finalizing setup",
]

export default function SearchLoader() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, currentStep])
        const nextTimer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1)
        }, 500) // Show check mark for 0.5 seconds before moving to next step
        return () => clearTimeout(nextTimer)
      }, 2000) // Show spinner for 2 seconds

      return () => clearTimeout(timer)
    }
  }, [currentStep])

  return (
    <div className="flex justify-center items-start h-screen w-full p-4 font-bold mt-16">
      <AnimatePresence mode="wait">
        {steps.map((step, index) => (
          index === currentStep && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-start space-x-3"
            >
              <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {!completedSteps.includes(index) ? (
                    <motion.div
                      key="spinner"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IOSSpinner />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-sm">{step}</span>
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  )
}

function IOSSpinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}
    