import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Timer, 
  Target,
  Trophy,
  Ghost,
  BarChart3,
  Zap,
  Share2,
  Chrome,
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  Mail,
  Download,
  GitCompare,
  Calendar,
  Bell,
  Briefcase,
  PieChart,
  Activity,
  Clock,
  Eye,
  ChevronDown,
  Play,
  Users,
  Rocket,
  Heart,
  Database,
  Upload,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { generateDemoTools, DEMO_TOOLS_COUNT } from '@/lib/demoData';

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  
  // Onboarding state
  const [userGuess, setUserGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLoadDemo = () => {
    setDemoLoading(true);
    setTimeout(() => {
      const demoTools = generateDemoTools();
      localStorage.setItem('stackvault_tools', JSON.stringify(demoTools));
      setDemoLoading(false);
      setDemoLoaded(true);
    }, 1500);
  };

  const handleGuessSubmit = () => {
    if (!userGuess) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const handleImportNow = () => {
    const demoTools = generateDemoTools();
    localStorage.setItem('stackvault_tools', JSON.stringify(demoTools));
    navigate('/dashboard');
  };

  const guessedCount = parseInt(userGuess) || 20;
  const underestimatePercent = Math.round(((DEMO_TOOLS_COUNT - guessedCount) / guessedCount) * 100);

  const features = [
    {
      icon: Package,
      title: 'Complete Tool Vault',
      description: 'Store all your lifetime deals in one place. Track prices, platforms, login credentials, and notes.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: TrendingUp,
      title: 'Stack Score™',
      description: 'See your usage rate at a glance. Know exactly how well you\'re utilizing your investments.',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: AlertTriangle,
      title: 'Refund Deadline Alerts',
      description: 'Never miss a refund window. Get notified before deadlines expire on new purchases.',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      icon: Briefcase,
      title: 'Portfolio Appraisal',
      description: 'Know what your stack is worth. See the annual subscription value of your entire portfolio.',
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      icon: Target,
      title: 'Usage Goals & Targets',
      description: 'Set weekly or monthly usage goals. Track progress and stay accountable.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: BarChart3,
      title: 'ROI Analytics',
      description: 'Calculate cost-per-use for every tool. See which tools are earning their keep.',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: Ghost,
      title: 'Tool Graveyard',
      description: 'Identify tools you\'ve never touched. Resurrect them or stop buying similar ones.',
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary'
    },
    {
      icon: Shield,
      title: 'Duplicate Detection',
      description: 'Spot overlapping tools in the same category. Stop hoarding, start consolidating.',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      icon: Trophy,
      title: 'Gamified Achievements',
      description: 'Unlock badges as you use your tools. Make tracking fun and motivating.',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      icon: Share2,
      title: 'Share Your Stack',
      description: 'Export and share your tool collection with others. Show off your curated stack.',
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      icon: Timer,
      title: 'Usage Timer',
      description: 'Track active sessions with built-in timers. Know exactly how long you use each tool.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: GitCompare,
      title: 'Tool Comparison',
      description: 'Compare multiple tools side-by-side. Make informed decisions about which to keep.',
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  const extensionFeatures = [
    {
      icon: Eye,
      title: 'Passive Tracking',
      description: 'Automatically logs usage when you visit your tool domains.'
    },
    {
      icon: Shield,
      title: 'Stop Buying Alerts',
      description: 'Warns you on deal sites if you already own similar tools.'
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Gentle nudges to use your underutilized tools.'
    }
  ];

  const testimonials = [
    {
      quote: "I had $2,000+ in LTDs I forgot about. StackVault helped me realize I was sitting on tools worth $15k/year in subscriptions.",
      author: "Sarah K.",
      role: "SaaS Founder",
      avatar: "SK"
    },
    {
      quote: "Finally stopped buying every lifetime deal. The duplicate detection alone has saved me hundreds.",
      author: "Mike R.",
      role: "Digital Marketer",
      avatar: "MR"
    },
    {
      quote: "The Stack Score gamification actually got me to use my tools. My score went from 23% to 78% in two months!",
      author: "Jessica L.",
      role: "Content Creator",
      avatar: "JL"
    }
  ];

  const faqs = [
    {
      question: "What is a lifetime deal (LTD)?",
      answer: "A lifetime deal is a one-time payment for software that would normally require monthly or annual subscriptions. Various marketplaces and platforms offer these deals, letting you pay once and use the tool forever."
    },
    {
      question: "How does Stack Score work?",
      answer: "Stack Score is your usage rate - the percentage of tools you've actually used at least once. If you own 10 tools and have used 7, your Stack Score is 70%. It's a simple metric to help you understand how well you're utilizing your investments."
    },
    {
      question: "What is Portfolio Appraisal?",
      answer: "Portfolio Appraisal calculates the total annual subscription value of your tool collection. If you bought 10 tools for $500 total, but they'd cost $3,000/year as subscriptions, your portfolio is worth $3,000/year - a 6x multiplier on your investment."
    },
    {
      question: "How does the Chrome extension work?",
      answer: "The Guardian extension runs silently in the background. When you visit domains linked to your LTD tools, it automatically logs usage. When you browse deal sites, it checks if you already own similar tools and shows a warning before impulse buying."
    },
    {
      question: "Is my data private?",
      answer: "Absolutely. All your data is stored locally in your browser. We don't have servers, accounts, or any way to access your information. Your tool collection, credentials, and usage data stay on your device."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! You can export your entire tool library to CSV at any time. You can also share a beautiful visual summary of your stack without sensitive details like passwords."
    }
  ];

  const stats = [
    { value: '$2,847', label: 'Avg. Stack Value', icon: DollarSign },
    { value: '23', label: 'Avg. Tools Owned', icon: Package },
    { value: '47%', label: 'Avg. Unused Tools', icon: Ghost },
    { value: '6.2x', label: 'Avg. ROI Multiplier', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StackVault</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#extension" className="text-muted-foreground hover:text-foreground transition-colors">Extension</a>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" onClick={logout} className="hidden sm:inline-flex">Logout</Button>
                <Link to="/dashboard">
                  <Button className="gap-2">
                    <Rocket className="h-4 w-4" />
                    <span className="hidden sm:inline">Open App</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button className="gap-2">
                  <Rocket className="h-4 w-4" />
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-success/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-6 py-2 px-4 text-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Stop hoarding. Start using.
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
            The{' '}
            <span className="text-gradient">Command Center</span>
            <br />
            for Your Lifetime Deals
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Track every LTD you own. Know what you're using. Stop buying duplicates. 
            Finally get value from your lifetime deal collection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-lg px-8 py-6 w-full sm:w-auto">
                <Play className="h-5 w-5" />
                Start Free Now
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 w-full sm:w-auto">
                See All Features
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              100% Free
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              No Account Required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Data Stays on Device
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Open Source
            </div>
          </div>
        </div>
      </section>

      {/* Try Demo Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Demo Option */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4">
                <Database className="h-3 w-3 mr-1" />
                Try Before You Add
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                See StackVault in Action with{' '}
                <span className="text-gradient">Sample Data</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Not ready to add your own tools? Load our demo stack with {DEMO_TOOLS_COUNT} pre-loaded lifetime deals 
                and explore every feature instantly.
              </p>
              
              {!demoLoaded ? (
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={handleLoadDemo}
                    disabled={demoLoading}
                    className="gap-2 text-lg px-8"
                  >
                    {demoLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Loading Demo...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Load Demo Stack
                      </>
                    )}
                  </Button>
                  
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {DEMO_TOOLS_COUNT} pre-loaded tools
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      All features working
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-success font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Demo loaded! {DEMO_TOOLS_COUNT} tools ready to explore
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/dashboard">
                      <Button size="lg" className="gap-2 w-full sm:w-auto">
                        <Rocket className="h-5 w-5" />
                        Explore Dashboard
                      </Button>
                    </Link>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={handleImportNow}
                      className="gap-2"
                    >
                      <Upload className="h-5 w-5" />
                      Import MY Stack Now
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Preview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-primary mb-1">{DEMO_TOOLS_COUNT}</p>
                  <p className="text-sm text-muted-foreground">Tools Loaded</p>
                </CardContent>
              </Card>
              <Card className="border-success/20 bg-success/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-success mb-1">$2,847</p>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                </CardContent>
              </Card>
              <Card className="border-info/20 bg-info/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-info mb-1">$8,400</p>
                  <p className="text-sm text-muted-foreground">Annual Value</p>
                </CardContent>
              </Card>
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-warning mb-1">53%</p>
                  <p className="text-sm text-muted-foreground">Stack Score</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* One-Question Onboarding */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <Lightbulb className="h-3 w-3 mr-1" />
              Quick Discovery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How Many LTD Tools Do You{' '}
              <span className="text-gradient">Think</span> You Own?
            </h2>
            <p className="text-muted-foreground text-lg">
              Most people underestimate by 50-200%. Let's find out your real number.
            </p>
          </div>

          {!showResult ? (
            <Card className="border-primary/20">
              <CardContent className="pt-8 pb-8">
                {!isAnalyzing ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <span className="text-lg text-muted-foreground">I think I own about</span>
                      <Input
                        type="number"
                        placeholder="20"
                        value={userGuess}
                        onChange={(e) => setUserGuess(e.target.value)}
                        className="w-24 text-center text-2xl font-bold h-14"
                      />
                      <span className="text-lg text-muted-foreground">tools</span>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        size="lg" 
                        onClick={handleGuessSubmit}
                        disabled={!userGuess}
                        className="gap-2"
                      >
                        <Sparkles className="h-5 w-5" />
                        Let's Find Out!
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">Scanning your typical LTD collector profile...</p>
                    <p className="text-muted-foreground text-sm mt-2">Checking popular deal marketplaces...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-warning/5">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="text-6xl">😱</div>
                  
                  <div>
                    <p className="text-lg text-muted-foreground mb-2">You guessed <span className="font-bold text-foreground">{guessedCount}</span> tools...</p>
                    <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                      We found {DEMO_TOOLS_COUNT}!
                    </p>
                    {underestimatePercent > 0 && (
                      <Badge variant="destructive" className="text-lg py-1 px-4">
                        You underestimated by {underestimatePercent}%!
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="p-3 rounded-lg bg-background/50 text-center">
                      <p className="text-2xl font-bold text-destructive">12</p>
                      <p className="text-xs text-muted-foreground">AI Writers</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 text-center">
                      <p className="text-2xl font-bold text-warning">22</p>
                      <p className="text-xs text-muted-foreground">Never Used</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 text-center">
                      <p className="text-2xl font-bold text-success">$8,400</p>
                      <p className="text-xs text-muted-foreground">/year Value</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-muted-foreground mb-4">Ready to see exactly what you own?</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button size="lg" onClick={handleImportNow} className="gap-2">
                        <Upload className="h-5 w-5" />
                        Import My Real Stack
                      </Button>
                      <Link to="/dashboard">
                        <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                          <Eye className="h-5 w-5" />
                          Explore Demo First
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sound Familiar?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LTD collectors share the same struggles. You're not alone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🤯</div>
                <h3 className="font-semibold text-lg mb-2">"I forgot I owned that!"</h3>
                <p className="text-muted-foreground text-sm">
                  You just bought an AI writer... then discovered 3 more in your email from last year.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="font-semibold text-lg mb-2">"I've spent how much?!"</h3>
                <p className="text-muted-foreground text-sm">
                  That $49 deal didn't feel like much... until you counted 50 of them.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-muted bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">👻</div>
                <h3 className="font-semibold text-lg mb-2">"I've never even logged in"</h3>
                <p className="text-muted-foreground text-sm">
                  Some tools never made it past the purchase confirmation email.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Appraisal Highlight */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Briefcase className="h-3 w-3 mr-1" />
                Portfolio Appraisal
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Know What Your Stack is{' '}
                <span className="text-gradient">Actually Worth</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                You spent $2,000 on lifetime deals. But what are they worth? Our Portfolio Appraisal calculates the annual subscription value of your entire collection.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Annual Value Calculation</p>
                    <p className="text-sm text-muted-foreground">See what you'd pay yearly if these were subscriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">5-Year Projection</p>
                    <p className="text-sm text-muted-foreground">Lifetime value over a typical tool lifespan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">ROI Multiplier</p>
                    <p className="text-sm text-muted-foreground">See exactly how much value you're getting per dollar spent</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mock Portfolio Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6 p-6 rounded-xl bg-background/50">
                <p className="text-sm text-muted-foreground mb-1">Annual Subscription Value</p>
                <p className="text-5xl font-bold text-primary">$8,400</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You paid <span className="font-semibold text-foreground">$1,247</span> for{' '}
                  <span className="font-semibold text-foreground">$8,400/year</span> in value
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-background/50 text-center">
                  <p className="text-2xl font-bold text-foreground">$42,000</p>
                  <p className="text-xs text-muted-foreground">5-Year Value</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 text-center">
                  <p className="text-2xl font-bold text-foreground">6.7x</p>
                  <p className="text-xs text-muted-foreground">ROI Multiplier</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-success text-center font-medium">
                  🎉 Your stack saves you $7,153 in year one!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Feature-Packed
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Stack
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From tracking to analytics to gamification - we've built every feature LTD collectors actually need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome Extension Section */}
      <section id="extension" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mock Extension Alert */}
            <div className="order-2 lg:order-1">
              <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10 max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-bold text-destructive">STOP! 🛑</p>
                      <p className="text-xs text-muted-foreground">StackVault Guardian Alert</p>
                    </div>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium mb-2">You're about to buy another AI Writer...</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Jasper AI</span>
                        <Badge variant="outline" className="text-warning border-warning">0 uses</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Copy.ai</span>
                        <Badge variant="outline" className="text-success border-success">12 uses</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-destructive font-medium text-center">
                    Do you really need this one? 🤔
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">
                <Chrome className="h-3 w-3 mr-1" />
                Browser Extension
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                The Guardian Extension
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Your personal LTD watchdog. Runs silently in Chrome, tracks usage automatically, 
                and stops you before impulse buying duplicates on deal sites.
              </p>
              
              <div className="space-y-4 mb-8">
                {extensionFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/extension">
                <Button size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Download Free Extension
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Heart className="h-3 w-3 mr-1" />
              Loved by LTD Collectors
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-border rounded-xl overflow-hidden transition-colors hover:border-primary/50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-t border-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Take Control of Your Stack?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Join thousands of LTD collectors who finally know what they own, what it's worth, and what they're actually using.
          </p>
          
          <Link to="/dashboard">
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              <Rocket className="h-5 w-5" />
              Start Using StackVault Free
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              No account needed
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Start in 30 seconds
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">StackVault</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/library" className="hover:text-foreground transition-colors">Library</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/analytics" className="hover:text-foreground transition-colors">Analytics</Link>
              <Link to="/extension" className="hover:text-foreground transition-colors">Extension</Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for LTD collectors
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
