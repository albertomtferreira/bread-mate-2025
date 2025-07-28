'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { NutritionalInfo } from '@/types';

interface NutritionalInfoDialogProps {
  children: React.ReactNode;
  productName: string;
  nutritionalInfo: NutritionalInfo;
  ingredients?: string;
}

const NutrientRow = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
    if (value === undefined || value === null) return null;
    return (
        <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value.toFixed(1)}{unit}</span>
        </div>
    )
}

export function NutritionalInfoDialog({
  children,
  productName,
  nutritionalInfo,
  ingredients,
}: NutritionalInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{productName}</DialogTitle>
          <DialogDescription>
            Nutritional Information & Ingredients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            <div>
                <h4 className="font-semibold mb-2">Nutrition per 100g</h4>
                <div className="text-sm">
                    <NutrientRow label="Energy" value={nutritionalInfo.energy} unit="kcal" />
                    <NutrientRow label="Fat" value={nutritionalInfo.fat} unit="g" />
                    <NutrientRow label="of which saturates" value={nutritionalInfo.saturates} unit="g" />
                    <NutrientRow label="Carbohydrate" value={nutritionalInfo.carbohydrates} unit="g" />
                    <NutrientRow label="of which sugars" value={nutritionalInfo.sugars} unit="g" />
                    <NutrientRow label="Fibre" value={nutritionalInfo.fibre} unit="g" />
                    <NutrientRow label="Protein" value={nutritionalInfo.protein} unit="g" />
                    <NutrientRow label="Salt" value={nutritionalInfo.salt} unit="g" />
                </div>
            </div>

            {ingredients && (
                <div>
                    <Separator className="my-4" />
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <p className="text-sm text-muted-foreground">
                        {ingredients}
                    </p>
                </div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
