'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('bi_token')
        if (token) {
            router.push('/dashboard')
        } else {
            router.push('/login')
        }
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Cargando...</div>
        </div>
    )
}
