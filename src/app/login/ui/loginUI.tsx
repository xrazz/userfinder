'use client'

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signInWithPopup } from "firebase/auth"
import { Loader2, LogIn } from "lucide-react"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, createUserSettings, googleProvider } from "@/app/firebaseClient"
 

const Navbar = () => (
  <nav className="w-full border-b fixed top-0 left-0 z-50 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo.svg" alt="UserFinder AI Logo" width={20} height={20} />
        <span className="font-bold text-lg">UserFinder AI</span>
      </Link>
    </div>
  </nav>
)

const Footer = () => (
  <footer className="bg-muted text-muted-foreground py-4">
    <div className="max-w-6xl mx-auto px-4 text-center text-sm">
      <p>&copy; {new Date().getFullYear()} UserFinder AI. All rights reserved.</p>
      <div className="mt-2 space-x-4">
        <Link href="/terms" className="hover:underline">Terms of use</Link>
        <Link href="/privacy" className="hover:underline">Privacy policy</Link>
        <Link href="/refund" className="hover:underline">Refund policy</Link>
      </div>
    </div>
  </footer>
)

const LoginUI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      await createUserSettings(user)

      const token = await user.getIdToken()
      const expirationTime = (Date.now() + 86400000).toString() // 1 day in milliseconds

      Cookies.set('token', token, { expires: 30, secure: true, sameSite: 'strict' })
      Cookies.set('token_expiration', expirationTime, { secure: true, sameSite: 'strict' })

      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error during Google login', error)
      setError('An error occurred during sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="UserFinder AI Logo" width={64} height={64} className="mb-4" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign in to UserFinder AI</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="default"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>
            {error && (
              <p className="mt-4 text-sm text-destructive text-center" role="alert">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

export default LoginUI






