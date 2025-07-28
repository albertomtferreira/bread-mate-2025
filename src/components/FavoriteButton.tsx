'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { toggleFavorite } from '@/services/userService';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { Button } from './ui/button';

interface FavoriteButtonProps {
  product: Product;
  className?: string;
}

export function FavoriteButton({ product, className }: FavoriteButtonProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFavorited = user?.favorites?.includes(product.id) ?? false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent link navigation
    e.stopPropagation(); // Stop event bubbling

    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to be logged in to save favorites.',
      });
      router.push('/signin');
      return;
    }

    setIsSubmitting(true);
    try {
      await toggleFavorite(user.uid, product.id, isFavorited);
      await refreshUser(); // Refresh user data to get latest favorites
      toast({
        title: isFavorited ? 'Removed from Favorites' : 'Added to Favorites',
        description: `${product.name} has been ${
          isFavorited ? 'removed from' : 'added to'
        } your favorites.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your favorites.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isSubmitting}
      className={cn('text-muted-foreground hover:text-destructive', className)}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isSubmitting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            isFavorited && 'fill-destructive text-destructive'
          )}
        />
      )}
    </Button>
  );
}
