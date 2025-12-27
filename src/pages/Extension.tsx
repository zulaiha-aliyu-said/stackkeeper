import React from 'react';
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
  Zap
} from 'lucide-react';

const Extension: React.FC = () => {
  const handleInstallExtension = () => {
    // This would link to Chrome Web Store in production
    window.open('https://chrome.google.com/webstore', '_blank');
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
            Your personal LTD watchdog. Automatically tracks usage and stops impulse purchases before they happen.
          </p>
          <Button size="lg" onClick={handleInstallExtension} className="gap-2 mt-4">
            <Download className="h-5 w-5" />
            Add to Chrome - It's Free
          </Button>
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
                Automatically logs time spent on your LTD tools
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
                    Recognizes domains linked to your LTD tools
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
                    Scans AppSumo, Dealify, and other deal sites
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
                    <p className="text-sm font-medium">Hold on! 🛑</p>
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
            <CardDescription>Get started in under 2 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Install the Extension</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Add to Chrome" above to install from the Chrome Web Store. The extension is lightweight and privacy-focused.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Add Tool URLs</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    For each tool in your library, add the website URL (e.g., app.relayter.com). The extension uses these to recognize when you're using your tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Enable Tracking</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the extension icon and toggle on tracking. You'll see a green badge when it's active.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Browse Normally</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    That's it! Use your tools as usual. The extension handles everything automatically and syncs with your dashboard.
                  </p>
                </div>
              </div>
            </div>
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
                  The Guardian only tracks domains you've explicitly added to your tool library. We never track browsing history, 
                  personal data, or any websites outside your LTD tools. All data stays on your device unless you choose to sync.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <Button size="lg" onClick={handleInstallExtension} className="gap-2">
            <Chrome className="h-5 w-5" />
            Install The Guardian Extension
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Free forever • No account required • Works offline
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Extension;
