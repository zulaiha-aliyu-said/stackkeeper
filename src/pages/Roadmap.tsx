import { Link } from 'react-router-dom';
import { Vault, CheckCircle2, Rocket, Lightbulb, Mail, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface RoadmapItem {
  name: string;
  description: string;
  timeline?: string;
}

const shipped: RoadmapItem[] = [
  { name: 'AI Receipt Scanner', description: 'Snap a purchase receipt and auto-add the tool to your vault.' },
  { name: 'Tool Comparison', description: 'Side-by-side compare any tools in your stack on usage, ROI and value.' },
  { name: 'Time Machine', description: 'Travel back to see how your stack and spending evolved over time.' },
  { name: 'Network Visualization', description: 'Interactive graph showing how your tools connect and overlap.' },
  { name: 'Browser Extension', description: 'The Guardian auto-tracks tool usage and warns about duplicate buys.' },
];

const comingSoon: RoadmapItem[] = [
  { name: 'Tool Wrapped', description: 'Your year in LTDs — a Spotify-Wrapped style recap of your stack.', timeline: 'Q2 2026' },
  { name: 'AI Purchase Advisor', description: 'Ask AI before you buy: "Do I really need another AI writer?"', timeline: 'Q2 2026' },
  { name: 'Mobile Apps', description: 'Native iOS and Android apps to track your stack on the go.', timeline: 'Q3 2026' },
];

const futureIdeas: RoadmapItem[] = [
  { name: 'Stack Psychologist', description: 'Behavioral analysis of your buying habits with personalized coaching.' },
  { name: 'Tool Resurrector', description: 'Smart prompts to revive forgotten tools before they go to waste.' },
  { name: 'Public API', description: 'Build your own integrations and dashboards on top of StackVault.' },
  { name: 'Desktop App', description: 'A native desktop companion for power users and offline access.' },
];

function ItemCard({ item, badge, badgeClass }: { item: RoadmapItem; badge: string; badgeClass: string }) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <Badge className={`${badgeClass} shrink-0`} variant="secondary">{badge}</Badge>
        </div>
        <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
      </CardHeader>
      {item.timeline && (
        <CardContent className="pt-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Target: <span className="text-foreground">{item.timeline}</span>
          </p>
        </CardContent>
      )}
    </Card>
  );
}

interface SectionProps {
  emoji: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  items: RoadmapItem[];
  badge: string;
  badgeClass: string;
  iconClass: string;
}

function Section({ emoji, icon: Icon, title, subtitle, items, badge, badgeClass, iconClass }: SectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span aria-hidden>{emoji}</span> {title}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.name} item={item} badge={badge} badgeClass={badgeClass} />
        ))}
      </div>
    </section>
  );
}

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[30%] h-[30%] rounded-full bg-info/5 blur-[100px]" />
      </div>

      {/* Top nav */}
      <nav className="relative z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-105">
              <Vault className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg">StackVault</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-fade-up">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium uppercase tracking-wider">
            Public Roadmap
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Roadmap — <span className="text-gradient">What's Coming Next</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A transparent look at what we just shipped, what's in the oven, and what we're dreaming about.
          </p>
        </div>

        <div className="space-y-16">
          <Section
            emoji="✅"
            icon={CheckCircle2}
            title="Recently Shipped"
            subtitle="Live and available right now."
            items={shipped}
            badge="Shipped"
            badgeClass="bg-success/15 text-success hover:bg-success/15 border-success/20"
            iconClass="bg-success/10 text-success"
          />

          <Section
            emoji="🚧"
            icon={Rocket}
            title="Coming Soon"
            subtitle="In active development with target dates."
            items={comingSoon}
            badge="In Progress"
            badgeClass="bg-warning/15 text-warning hover:bg-warning/15 border-warning/20"
            iconClass="bg-warning/10 text-warning"
          />

          <Section
            emoji="💡"
            icon={Lightbulb}
            title="Future Ideas"
            subtitle="Concepts we're exploring — no commitments yet."
            items={futureIdeas}
            badge="Idea"
            badgeClass="bg-secondary text-secondary-foreground hover:bg-secondary border-border"
            iconClass="bg-info/10 text-info"
          />
        </div>

        {/* Feature request CTA */}
        <Card className="mt-20 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-info to-primary" />
          <CardContent className="py-10 px-6 sm:px-10 text-center space-y-4">
            <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Want to request a feature?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We read every email. Tell us what would make StackVault indispensable for you.
            </p>
            <a href="mailto:zulaihaaliyu440@gmail.com">
              <Button size="lg" className="gap-2 mt-2">
                <Mail className="h-4 w-4" />
                zulaihaaliyu440@gmail.com
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          © 2026 StackVault. Roadmap is indicative and subject to change.
        </div>
      </footer>
    </div>
  );
}
