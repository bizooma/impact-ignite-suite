import React from 'react';
import { Label } from '@/components/ui/label';
import { Square, Circle, Heart, Star, Hexagon, Triangle, Cloud, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QrShape = 'square' | 'circle' | 'rounded' | 'dots' | 'heart' | 'star' | 'hexagon' | 'triangle' | 'cloud' | 'sparkle';

interface QrShapePickerProps {
  value: QrShape;
  onChange: (shape: QrShape) => void;
}

const shapes: { id: QrShape; icon: React.ReactNode; label: string }[] = [
  { id: 'square', icon: <Square className="h-5 w-5" />, label: 'Square' },
  { id: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Circle' },
  { id: 'rounded', icon: <Square className="h-5 w-5 rounded-lg" />, label: 'Rounded' },
  { id: 'dots', icon: <Circle className="h-2 w-2" />, label: 'Dots' },
  { id: 'heart', icon: <Heart className="h-5 w-5" />, label: 'Heart' },
  { id: 'star', icon: <Star className="h-5 w-5" />, label: 'Star' },
  { id: 'hexagon', icon: <Hexagon className="h-5 w-5" />, label: 'Hexagon' },
  { id: 'triangle', icon: <Triangle className="h-5 w-5" />, label: 'Triangle' },
  { id: 'cloud', icon: <Cloud className="h-5 w-5" />, label: 'Cloud' },
  { id: 'sparkle', icon: <Sparkles className="h-5 w-5" />, label: 'Sparkle' },
];

export const QrShapePicker: React.FC<QrShapePickerProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label>QR Code Shape</Label>
      <div className="grid grid-cols-5 gap-2">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={() => onChange(shape.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-accent",
              value === shape.id 
                ? "border-primary bg-accent shadow-sm" 
                : "border-border"
            )}
          >
            <div className={cn(
              "transition-colors",
              value === shape.id ? "text-primary" : "text-muted-foreground"
            )}>
              {shape.icon}
            </div>
            <span className={cn(
              "text-xs font-medium transition-colors",
              value === shape.id ? "text-primary" : "text-muted-foreground"
            )}>
              {shape.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose the shape style for your QR code modules
      </p>
    </div>
  );
};
