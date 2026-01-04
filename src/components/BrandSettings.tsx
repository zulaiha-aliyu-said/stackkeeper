import { useState, useRef } from 'react';
import { useBranding } from '@/hooks/useBranding';
import { useTier } from '@/hooks/useTier';
import { ColorPicker } from '@/components/ColorPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette, Upload, RotateCcw, Lock, Crown, Vault } from 'lucide-react';
import { toast } from 'sonner';

export function BrandSettings() {
  const { 
    branding, 
    updateBranding, 
    resetBranding, 
    canCustomizeBranding,
    defaultBranding 
  } = useBranding();
  const { setTier } = useTier();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateBranding({ logo: e.target?.result as string });
      toast.success('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setIsResetting(true);
    resetBranding();
    toast.success('Branding reset to defaults');
    setTimeout(() => setIsResetting(false), 500);
  };

  if (!canCustomizeBranding) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Brand Customization Locked</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Upgrade to the Agency plan to customize your branding, including logo, colors, and remove the "Powered by" badge.
          </p>
          <Button onClick={() => setTier('agency')} className="gap-2">
            <Crown className="h-4 w-4" />
            Upgrade to Agency
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Customization
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your StackVault instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-border bg-secondary flex items-center justify-center overflow-hidden">
                {branding.logo ? (
                  <img 
                    src={branding.logo} 
                    alt="Custom logo" 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Vault className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
                {branding.logo && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => updateBranding({ logo: null })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, at least 128x128px, PNG or SVG
            </p>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              value={branding.appName}
              onChange={(e) => updateBranding({ appName: e.target.value })}
              placeholder="StackVault"
            />
            <p className="text-xs text-muted-foreground">
              This will appear in the navigation bar
            </p>
          </div>

          {/* Primary Color */}
          <ColorPicker
            label="Primary Color"
            value={branding.primaryColor}
            onChange={(color) => updateBranding({ primaryColor: color })}
          />

          {/* Accent Color */}
          <ColorPicker
            label="Accent Color"
            value={branding.accentColor}
            onChange={(color) => updateBranding({ accentColor: color })}
          />

          {/* Powered By Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Show "Powered by StackVault"</Label>
              <p className="text-xs text-muted-foreground">
                Display attribution in the footer
              </p>
            </div>
            <Switch
              checked={branding.showPoweredBy}
              onCheckedChange={(checked) => updateBranding({ showPoweredBy: checked })}
            />
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-xl border border-border p-4 bg-background">
              <div className="flex items-center gap-3">
                <div 
                  className="h-9 w-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${branding.primaryColor} / 0.1)` }}
                >
                  {branding.logo ? (
                    <img src={branding.logo} alt="" className="h-5 w-5 object-contain" />
                  ) : (
                    <Vault className="h-5 w-5" style={{ color: `hsl(${branding.primaryColor})` }} />
                  )}
                </div>
                <span className="text-xl font-bold">{branding.appName || 'StackVault'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <div 
                  className="h-8 px-4 rounded-lg flex items-center text-sm font-medium"
                  style={{ 
                    backgroundColor: `hsl(${branding.primaryColor})`,
                    color: 'white'
                  }}
                >
                  Primary Button
                </div>
                <div 
                  className="h-8 px-4 rounded-lg flex items-center text-sm font-medium border"
                  style={{ 
                    borderColor: `hsl(${branding.accentColor})`,
                    color: `hsl(${branding.accentColor})`
                  }}
                >
                  Accent Button
                </div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isResetting}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
