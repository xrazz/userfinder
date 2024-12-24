'use client'

import SearchTab from '../searchUI'
import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebaseClient'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
    const [userData, setUserData] = useState({
        Membership: '',
        name: '',
        email: '',
        userId: '',
        imageUrl: ''
    })
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const auth = getAuth()
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.email!))
                    const userData = userDoc.data()
                    
                    setUserData({
                        Membership: userData?.membershipLevel || 'Free',
                        name: user.displayName || '',
                        email: user.email || '',
                        userId: user.uid,
                        imageUrl: user.photoURL || ''
                    })
                } catch (error) {
                    console.error('Error fetching user data:', error)
                    // In caso di errore, reimposta i dati utente
                    setUserData({
                        Membership: '',
                        name: '',
                        email: '',
                        userId: '',
                        imageUrl: ''
                    })
                }
            } else {
                // Se non c'è un utente, reimposta i dati
                setUserData({
                    Membership: '',
                    name: '',
                    email: '',
                    userId: '',
                    imageUrl: ''
                })
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    if (loading) return null

    return <SearchTab {...userData} />
} 