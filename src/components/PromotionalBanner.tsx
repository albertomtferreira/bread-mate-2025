'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface BannerContent {
    bannerEnabled: boolean;
    bannerText?: string;
}

export function PromotionalBanner() {
    const [content, setContent] = useState<BannerContent | null>(null);

    useEffect(() => {
        const contentRef = doc(db, 'siteContent', 'text');
        const unsubscribe = onSnapshot(contentRef, (docSnap) => {
            if (docSnap.exists()) {
                setContent(docSnap.data() as BannerContent);
            } else {
                setContent(null);
            }
        });

        return () => unsubscribe();
    }, []);

    if (!content?.bannerEnabled || !content.bannerText) {
        return null;
    }

    return (
        <div className="bg-primary text-primary-foreground">
             <div className="container mx-auto flex h-10 items-center justify-center text-sm font-medium">
                {content.bannerText}
            </div>
        </div>
    );
}
