import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Chrome, 
  Download, 
  Shield, 
  Eye, 
  Bell, 
  Timer, 
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Globe,
  AlertTriangle,
  Zap,
  Package,
  Loader2,
  Copy,
  Key
} from 'lucide-react';
import { generateExtensionZip } from '@/lib/extensionFiles';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Extension: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const { session } = useAuth();

  const generateConnectionToken = async () => {
    if (!session) {
      toast.error('Please log in first to connect the extension.');
      return;
    }

    const tokenData = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://wfbrmywecdrtidcbnxoe.supabase.co',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYnJteXdlY2RydGlkY2JueG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzEwNTYsImV4cCI6MjA4NTg0NzA1Nn0.Nd2Zep47PS-2UauasYJIhFKSIq-YkW_Y-HwVc9GzMd4',
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    };

    const token = btoa(JSON.stringify(tokenData));
    setConnectionToken(token);
    toast.success('Connection token generated!');
  };

  const copyToken = () => {
    if (connectionToken) {
      navigator.clipboard.writeText(connectionToken);
      toast.success('Token copied to clipboard!');
    }
  };

  const handleDownloadExtension = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateExtensionZip();
      saveAs(blob, 'stackvault-guardian-extension.zip');
      toast.success('Extension downloaded! Follow the setup guide below to install.');
    } catch (error) {
      console.error('Failed to generate extension:', error);
      toast.error('Failed to download extension. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-4">
            <Chrome className="h-3 w-3 mr-1" />
            Chrome Extension
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            The Guardian Extension
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal ltd watchdog. Automatically tracks usage and stops impulse purchases before they happen.
          </p>
          <Button 
            size="lg" 
            onClick={handleDownloadExtension} 
            className="gap-2 mt-4"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Extension (ZIP)
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            <Package className="h-3 w-3 inline mr-1" />
            Manual installation required - follow setup guide below
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Passive Tracking */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Passive Usage Tracking</CardTitle>
              <CardDescription>
                Automatically logs time spent on your ltd tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Works silently in the background - no manual logging needed
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Recognizes domains linked to your ltd tools
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Syncs usage data with your dashboard in real-time
                  </p>
                </div>
              </div>

              {/* Demo Flow */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-3">HOW IT WORKS</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>You visit app.relayter.com</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-1" />
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Extension recognizes the domain</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-1" />
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-green-500" />
                    <span>Logs: "Active on Relayter for 15 min"</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stop Buying Alert */}
          <Card className="relative overflow-hidden border-destructive/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Stop Buying Alerts</CardTitle>
              <CardDescription>
                Warns you before impulse purchasing duplicate tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Scans ltd marketplaces, Dealify, and other deal sites
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Matches product categories with your existing tools
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Shows usage stats of similar tools you already own
                  </p>
                </div>
              </div>

              {/* Demo Alert */}
              <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hold on!</p>
                    <p className="text-xs text-muted-foreground">
                      You already own <strong>2 AI Writers</strong>. One has <strong>0% usage</strong> this month.
                    </p>
                    <p className="text-xs text-destructive font-medium mt-2">
                      Do you really need this one?
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Card className="text-center p-6">
            <Timer className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Auto Time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              No more manual logging. Every minute counts automatically.
            </p>
          </Card>

          <Card className="text-center p-6">
            <Bell className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Smart Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Gentle reminders to use your underutilized tools.
            </p>
          </Card>

          <Card className="text-center p-6">
            <TrendingDown className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Spending Insights</h3>
            <p className="text-sm text-muted-foreground">
              See your real cost-per-use before buying more.
            </p>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Installation Guide (Developer Mode)
            </CardTitle>
            <CardDescription>
              Since this extension isn't on the Chrome Web Store yet, follow these steps to install manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Download & Extract</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the download button above, then <strong>unzip the file</strong> to a folder on your computer (e.g., Desktop/stackvault-guardian).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Open Chrome Extensions</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to <code className="bg-muted px-2 py-0.5 rounded text-xs">chrome://extensions/</code> in your browser address bar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Enable Developer Mode</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle <strong>"Developer mode"</strong> ON in the top-right corner of the extensions page.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Load the Extension</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>"Load unpacked"</strong> button and select the unzipped folder. The Guardian icon should appear in your toolbar!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-medium">Add Your Tool Domains</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the Guardian icon and add domains for your ltd tools (e.g., <code className="bg-muted px-2 py-0.5 rounded text-xs">relayter.com</code>). The extension will now track your usage automatically!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connect Extension */}
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Connect Your Extension
            </CardTitle>
            <CardDescription>
              Generate a token to link the Guardian extension to your account. This enables automatic usage syncing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!connectionToken ? (
              <Button onClick={generateConnectionToken} className="gap-2" disabled={!session}>
                <Key className="h-4 w-4" />
                Generate Connection Token
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">YOUR TOKEN (click to copy):</p>
                  <div
                    onClick={copyToken}
                    className="text-xs font-mono break-all cursor-pointer bg-background p-3 rounded border border-border hover:border-primary/50 transition-colors max-h-24 overflow-y-auto"
                  >
                    {connectionToken}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToken} className="gap-1">
                    <Copy className="h-3 w-3" />
                    Copy Token
                  </Button>
                  <Button variant="ghost" size="sm" onClick={generateConnectionToken}>
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Open the Guardian extension popup → paste this token → click Connect. Your tools will sync automatically!
                </p>
              </div>
            )}
            {!session && (
              <p className="text-xs text-destructive">Please log in to generate a connection token.</p>
            )}
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-muted-foreground shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Privacy First</h4>
                <p className="text-sm text-muted-foreground">
                  The Guardian only tracks domains matching your tool URLs. No browsing history is collected. 
                  Usage data syncs only to your StackVault account via your secure connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <Button 
            size="lg" 
            onClick={handleDownloadExtension} 
            className="gap-2"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download The Guardian Extension
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Free forever • Open source • Privacy focused
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Extension;
