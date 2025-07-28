'use client';

import type { NutritionalInfo } from '@/types';
import { cn } from '@/lib/utils';
import { NutritionalInfoDialog } from './NutritionalInfoDialog';

interface NutritionalDisplayProps {
  nutritionalInfo: NutritionalInfo;
  ingredients?: string;
  productName: string;
}

// Reference intakes for an average adult
const ri = {
  energy: 8400, // kJ
  fat: 70, // g
  saturates: 20, // g
  sugars: 90, // g
  salt: 6, // g
};

// Thresholds for traffic light colours per 100g
const thresholds = {
  fat: { low: 3, high: 17.5 },
  saturates: { low: 1.5, high: 5 },
  sugars: { low: 5, high: 22.5 },
  salt: { low: 0.3, high: 1.5 },
};

const getTrafficLightInfo = (
  nutrient: 'fat' | 'saturates' | 'sugars' | 'salt',
  value: number
): { color: string; label: 'LOW' | 'MED' | 'HIGH' } => {
  if (value <= thresholds[nutrient].low) {
    return { color: 'bg-green-600', label: 'LOW' };
  }
  if (value > thresholds[nutrient].high) {
    return { color: 'bg-red-600', label: 'HIGH' };
  }
  return { color: 'bg-amber-500', label: 'MED' };
};

const NutrientItem = ({
  title,
  value,
  unit,
  riPercent,
  color = 'bg-white',
  level,
  className,
}: {
  title: string;
  value: string;
  unit: string;
  riPercent: string;
  color?: string;
  level?: 'LOW' | 'MED' | 'HIGH';
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col flex-1 text-center border-r border-gray-400 last:border-r-0',
       color !== 'bg-white' && 'text-white'
    )}
  >
    <div className={cn('p-1 flex-grow flex flex-col justify-center', color)}>
      <div className="text-[10px] font-bold leading-tight">{title}</div>
      <div className="text-base font-extrabold -my-0.5">
        {value}
        <span className="font-bold text-xs">{unit}</span>
      </div>
      {level && (
        <div className="text-[10px] leading-tight bg-white text-black font-bold rounded-full px-1 py-0 inline-block my-0.5 self-center">
          {level}
        </div>
      )}
    </div>
    <div className="bg-white py-0.5 text-black text-xs">
      <span className="font-bold">{riPercent}%</span>
    </div>
  </div>
);

const EnergyItem = ({
  kcal,
  riPercent,
}: {
  kcal?: number;
  riPercent: string;
}) => {
  if (kcal === undefined) return null;
  const kJ = Math.round(kcal * 4.184);

  return (
    <div className="flex flex-col flex-1 text-center border-r border-gray-400">
      <div className="p-1 bg-white flex-grow flex flex-col justify-center">
        <div className="text-[10px] font-bold leading-tight">Energy</div>
        <div className="text-xs font-bold leading-tight">{kJ}kJ</div>
        <div className="text-xs font-bold leading-tight">{Math.round(kcal)}kcal</div>
      </div>
      <div className="bg-white py-0.5 text-xs">
        <span className="font-bold">{riPercent}%</span>
      </div>
    </div>
  );
};


export function NutritionalDisplay({
  nutritionalInfo,
  ingredients,
  productName,
}: NutritionalDisplayProps) {
  if (!nutritionalInfo || Object.values(nutritionalInfo).every(v => v === undefined || v === null)) {
    return null;
  }
  
  const { energy = 0, fat = 0, saturates = 0, sugars = 0, salt = 0 } = nutritionalInfo;

  const fatInfo = getTrafficLightInfo('fat', fat);
  const saturatesInfo = getTrafficLightInfo('saturates', saturates);
  const sugarsInfo = getTrafficLightInfo('sugars', sugars);
  const saltInfo = getTrafficLightInfo('salt', salt);

  const calculateRI = (value: number, reference: number) => {
    if(reference === 0) return '0';
    return Math.round((value / reference) * 100).toString();
  }

  return (
    <NutritionalInfoDialog nutritionalInfo={nutritionalInfo} ingredients={ingredients} productName={productName}>
        <div className="mt-4 p-0 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
            <h4 className="text-xs font-semibold mb-1 text-center text-muted-foreground pt-1">Nutrition per 100g</h4>
            <div className="flex justify-center border-2 border-gray-400 overflow-hidden rounded-lg mx-2">
               <EnergyItem 
                    kcal={energy}
                    riPercent={calculateRI(energy * 4.184, ri.energy)}
               />
               <NutrientItem 
                    title="Fat"
                    value={fat.toFixed(1)}
                    unit="g"
                    riPercent={calculateRI(fat, ri.fat)}
                    color={fatInfo.color}
                    level={fatInfo.label}
                />
                 <NutrientItem 
                    title="Saturates"
                    value={saturates.toFixed(1)}
                    unit="g"
                    riPercent={calculateRI(saturates, ri.saturates)}
                    color={saturatesInfo.color}
                    level={saturatesInfo.label}
                />
                 <NutrientItem 
                    title="Sugars"
                    value={sugars.toFixed(1)}
                    unit="g"
                    riPercent={calculateRI(sugars, ri.sugars)}
                    color={sugarsInfo.color}
                    level={sugarsInfo.label}
                />
                 <NutrientItem 
                    title="Salt"
                    value={salt.toFixed(1)}
                    unit="g"
                    riPercent={calculateRI(salt, ri.salt)}
                    color={saltInfo.color}
                    level={saltInfo.label}
                />
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1 pb-1">of an adult's reference intake</p>
        </div>
    </NutritionalInfoDialog>
  );
}
