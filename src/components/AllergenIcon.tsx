'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wheat, Milk, Egg, Shell, Bean, VenetianMask } from 'lucide-react';

const allergenIconMap: { [key: string]: React.ReactNode } = {
  wheat: <Wheat />,
  nuts: <Shell />,
  milk: <Milk />,
  soya: <Bean />,
  eggs: <Egg />,
};

const getIconFor = (allergen: string) => {
    const lowerCaseAllergen = allergen.toLowerCase();
    for (const key in allergenIconMap) {
        if (lowerCaseAllergen.includes(key)) {
            return allergenIconMap[key];
        }
    }
    return <VenetianMask />; // Default icon for "Other" or unknown
}


export function AllergenIcon({ allergen }: { allergen: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            {getIconFor(allergen)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{allergen}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
