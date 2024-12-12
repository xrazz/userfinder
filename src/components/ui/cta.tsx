import { Button } from "@/components/ui/button"

export default function Component() {
  return (
    <div className=" px-4 max-w-5xl mb-14 mx-auto">
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-45 h-45 bg-gray-200   flex items-center justify-center">
          {/* <span className="text-gray-500 text-sm">Image Placeholder</span> */}
          <img src="/users.svg" alt="users" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Get your perfect users right now</h2>
        </div>
        <Button size="lg" className="px-8">
        <a href="/login">
                Get Started Free
              </a>
        </Button>
      </div>
    </div>
  )
}