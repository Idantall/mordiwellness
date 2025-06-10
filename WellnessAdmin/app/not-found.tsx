'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/main');
        }, 5000);

        setInterval(() => {
            setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <h1 className="text-4xl font-bold mb-4">404 - תוכן לא נמצא</h1>
            <p className="text-lg mb-4">הדף שחיפשת לא נמצא.</p>
            <p className="text-lg mb-4">תועבר לדף הראשי בעוד {countdown} שניות.</p>
            <Button variant="default" onClick={() => router.push('/main')}>
                חזור לדף הראשי עכשיו
            </Button>
        </div>
    );
}
