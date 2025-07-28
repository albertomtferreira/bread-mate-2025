'use client';

import type { NutritionalInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NutritionalInfoDialog } from './NutritionalInfoDialog';

interface NutritionalDisplayProps {
  nutritionalInfo: NutritionalInfo;
  ingredients?: string;
  productName: string;
}

const getTrafficLightColor = (
  nutrient: 'fat' | 'saturates' | 'sugars' | 'salt',
  value: number
) => {
  const thresholds = {
    fat: { low: 3, high: 17.5 },
    saturates: { low: 1.5, high: 5 },
    sugars: { low: 5, high: 22.5 },
    salt: { low: 0.3, high: 1.5 },
  };

  if (value <= thresholds[nutrient].low) {
    return 'bg-green-500 hover:bg-green-500/90';
  }
  if (value > thresholds[nutrient].high) {
    return 'bg-red-500 hover:bg-red-500/90';
  }
  return 'bg-amber-500 hover:bg-amber-500/90';
};

const NutrientItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="flex flex-col items-center">
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs',
        color
      )}
    >
      {value}
    </div>
    <span className="text-xs text-muted-foreground mt-1">{label}</span>
  </div>
);

export function NutritionalDisplay({
  nutritionalInfo,
  ingredients,
  productName
}: NutritionalDisplayProps) {
  // Render only if we have at least one key value pair
  if (!nutritionalInfo || Object.values(nutritionalInfo).every(v => v === undefined || v === null || v === 0)) {
    return null;
  }
  
  return (
    <NutritionalInfoDialog nutritionalInfo={nutritionalInfo} ingredients={ingredients} productName={productName}>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
            <h4 className="text-sm font-semibold mb-2 text-center text-muted-foreground">Nutrition per 100g</h4>
            <div className="flex justify-around items-start">
            {nutritionalInfo.fat !== undefined && (
                <NutrientItem
                label="Fat"
                value={nutritionalInfo.fat.toFixed(1)}
                color={getTrafficLightColor('fat', nutritionalInfo.fat)}
                />
            )}
            {nutritionalInfo.saturates !== undefined && (
                <NutrientItem
                label="Saturates"
                value={nutritionalInfo.saturates.toFixed(1)}
                color={getTrafficLightColor('saturates', nutritionalInfo.saturates)}
                />
            )}
            {nutritionalInfo.sugars !== undefined && (
                <NutrientItem
                label="Sugars"
                value={nutritionalInfo.sugars.toFixed(1)}
                color={getTrafficLightColor('sugars', nutritionalInfo.sugars)}
                />
            )}
            {nutritionalInfo.salt !== undefined && (
                <NutrientItem
                label="Salt"
                value={nutritionalInfo.salt.toFixed(1)}
                color={getTrafficLightColor('salt', nutritionalInfo.salt)}
                />
            )}
            </div>
        </div>
    </NutritionalInfoDialog>
  );
}
