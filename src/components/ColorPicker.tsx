import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const presetColors = [
  { name: 'Emerald', value: '160 84% 39%' },
  { name: 'Blue', value: '217 91% 60%' },
  { name: 'Purple', value: '262 83% 58%' },
  { name: 'Pink', value: '330 81% 60%' },
  { name: 'Red', value: '0 84% 60%' },
  { name: 'Orange', value: '25 95% 53%' },
  { name: 'Yellow', value: '45 93% 47%' },
  { name: 'Teal', value: '174 72% 40%' },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(' ').map(p => parseFloat(p.replace('%', '')));
  if (parts.length !== 3) return '#10b981';
  
  const [h, s, l] = parts;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '160 84% 39%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  const hexValue = hslToHex(value);

  const handleHexChange = (hex: string) => {
    const hsl = hexToHsl(hex);
    onChange(hsl);
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className="flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            key={color.name}
            type="button"
            disabled={disabled}
            onClick={() => onChange(color.value)}
            className={cn(
              "w-8 h-8 rounded-lg border-2 transition-all",
              value === color.value ? "border-foreground scale-110" : "border-transparent hover:scale-105",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: `hsl(${color.value})` }}
            title={color.name}
          />
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div 
          className="w-10 h-10 rounded-lg border border-border"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        <Input
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#10b981"
          className="font-mono uppercase w-28"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = hexValue;
            input.onchange = (e) => handleHexChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        >
          Pick
        </Button>
      </div>
    </div>
  );
}
