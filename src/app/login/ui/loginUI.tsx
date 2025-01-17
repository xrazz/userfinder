'use client'

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signInWithPopup } from "firebase/auth"
import { Loader2 } from "lucide-react"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth, createUserSettings, googleProvider, signUpWithEmail, signInWithEmail, resetPassword } from "@/app/firebaseClient"

const gradientTextStyle = {
  backgroundSize: '200% auto',
  animation: 'shine 3s linear infinite',
}

const Navbar = () => {
  return (
    <nav className="w-full border-none fixed top-0 left-0 z-50 px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* <div className="flex items-center space-x-2">
          <Image src="/logo-round.svg" alt="UserFinder AI Logo" width={30} height={30} />
          <span className="font-bold text-lg">Login</span>
        </div> */}
          <div className="flex items-center">
                <Link href="/" className="flex items-center gap-1.5 select-none group">
                    <span 
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-primary"
                        style={{
                            ...gradientTextStyle,
                        }}
                    >
                        LEXY
                    </span>
                </Link>
            </div>
        {/* <span className="text-lg font-semibold">Refund Policy</span> */}
      </div>
    </nav>
  )
}

export default function LoginUI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [forgotPassword, setForgotPassword] = useState(false)

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

      // window.location.href = '/checkout'
      window.location.href = '/'
    } catch (error) {
      console.error('Error during Google login', error)
      setError('An error occurred during sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let user;
      if (forgotPassword) {
        await resetPassword(email)
        setError("Password reset email sent. Please check your inbox.")
        setForgotPassword(false)
        setLoading(false)
        return
      }

      if (isSignUp) {
        user = await signUpWithEmail(email, password)
      } else {
        user = await signInWithEmail(email, password)
      }

      const token = await user.getIdToken()
      const expirationTime = (Date.now() + 86400000).toString()

      Cookies.set('token', token, { expires: 30, secure: true, sameSite: 'strict' })
      Cookies.set('token_expiration', expirationTime, { secure: true, sameSite: 'strict' })

      window.location.href = '/'
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Navbar />
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Think it. Find it.</h1>
          <p className="text-xl text-muted-foreground">Log in to Lexy</p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!forgotPassword && (
            <>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          {forgotPassword ? (
            <>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForgotPassword(false)}
                className="w-full"
              >
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Log In'
                )}
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline"
                >
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? 'Logging in...' : 'Continue with Google'}
          </Button>

          {/* Comment out Apple sign in button for now
          <Button
            onClick={handleAppleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.2 0-1.39.68-2.12.53-3.02-.36-5.16-5.38-3.54-13.36 2.68-13.17 1.25.04 2.12.62 2.95.65.89.03 1.73-.54 3.05-.61 2.7-.14 4.56 1.5 5.41 3.68-5.02 2.45-4.25 8.83.7 10.01-.7 1.45-1.51 2.46-2.49 3.4ZM12.03 7.25c-.15-2.66 2.15-4.94 4.8-5.1.31 2.82-2.56 5.13-4.8 5.1Z" />
              </svg>
            )}
            {loading ? 'Logging in...' : 'Continue with Apple'}
          </Button>
          */}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8 max-w-[400px]">
        By continuing, you acknowledge that you understand and agree to Lexy's Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
