'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ImageBannerContent {
    imageBannerEnabled: boolean;
    imageBannerSrc?: string;
    imageBannerAlt?: string;
    imageBannerHint?: string;
}

export function ImageBanner() {
    const [content, setContent] = useState<ImageBannerContent | null>(null);

    useEffect(() => {
        const contentRef = doc(db, 'siteContent', 'text');
        const unsubscribe = onSnapshot(contentRef, (docSnap) => {
            if (docSnap.exists()) {
                setContent(docSnap.data() as ImageBannerContent);
            } else {
                setContent(null);
            }
        });

        return () => unsubscribe();
    }, []);

    if (!content?.imageBannerEnabled || !content.imageBannerSrc) {
        return null;
    }

    return (
        <section className="w-full bg-background">
            <div className="container mx-auto py-4">
                <div className="relative w-full aspect-[16/3] md:aspect-[16/2] lg:aspect-[16/1.5] rounded-lg overflow-hidden">
                    <Image
                        src={content.imageBannerSrc}
                        alt={content.imageBannerAlt || 'Promotional banner'}
                        data-ai-hint={content.imageBannerHint || 'promotion'}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>
        </section>
    );
}
