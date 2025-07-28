
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface BannerContent {
    bannerEnabled: boolean;
    bannerText?: string;
    bannerLink?: string;
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

    const Wrapper = content.bannerLink ? Link : 'div';

    return (
        <div className="bg-primary text-primary-foreground">
             <Wrapper
                href={content.bannerLink || '#'}
                className={cn(
                    "container mx-auto flex h-10 items-center justify-center text-sm font-medium",
                    content.bannerLink && "hover:bg-primary/90 transition-colors"
                )}
            >
                {content.bannerText}
                {content.bannerLink && <ArrowRight className="ml-2 h-4 w-4" />}
            </Wrapper>
        </div>
    );
}

    