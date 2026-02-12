import { Link } from 'react-router-dom';
import { Check, Crown, Package, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { useState } from 'react';

const tiers = [
  {
    name: 'Starter',
    price: '$49',
    description: 'For casual LTD collectors',
    features: ['Up to 25 tools', 'Basic dashboard', 'Spending charts', 'Duplicate detection'],
    buttonText: 'Get Started',
    link: '/auth?plan=starter',
  },
  {
    name: 'Pro',
    price: '$99',
    description: 'For serious collectors',
    features: ['Unlimited tools', 'ROI Calculator', 'Stack Health Doctor', 'Time Machine', 'Streaks & Achievements'],
    buttonText: 'Go Pro',
    popular: true,
    link: '/auth?plan=pro',
  },
  {
    name: 'Agency',
    price: '$149',
    description: 'For agencies & power users',
    features: ['Everything in Pro', 'Up to 5 stacks', '3 team members', 'Custom branding', 'Stack Battles', 'Email Import'],
    buttonText: 'Buy Agency',
    link: '/auth?plan=agency',
  },
];

const faqs = [
  {
    question: "Is it really a one-time payment?",
    answer: "Yes! We believe in the LTD model. You pay once and get access to the features in your plan forever. No hidden fees or recurring subscriptions."
  },
  {
    question: "Can I upgrade later?",
    answer: "Absolutely. You can upgrade from Starter to Pro or Agency at any time by just paying the difference."
  },
  {
    question: "What happens if I exceed my tool limit?",
    answer: "If you're on the Starter plan and reach 25 tools, you'll need to upgrade to Pro to add more. All your existing data will remain safe."
  },
  {
    question: "Is there a free trial?",
    answer: "We don't have a trial, but we have a 100% free mode that lets you manage up to 5 tools so you can try out the interface before buying."
  }
];

function PricingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-20">
      <div className="text-center">
        <Badge variant="secondary" className="mb-4 py-1 px-4">
          Pricing Plans
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          Simple, <span className="text-gradient">Lifetime</span> Pricing
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          No subscriptions. Pay once, use forever. Choose the plan that fits your LTD collection.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground ml-2 text-sm font-normal">one-time</span>
              </div>
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-primary/10 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Link to={tier.link}>
                <Button className="w-full gap-2" variant={tier.popular ? 'default' : 'outline'}>
                  {tier.name === 'Agency' && <Crown className="h-4 w-4" />}
                  {tier.buttonText}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium mb-6">
          <Star className="h-4 w-4 text-warning fill-warning" />
          Join 2,000+ LTD collectors
        </div>
        <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4 text-left">
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
    </div>
  );
}

export default function Pricing() {
  const { user } = useAuth();

  if (user) {
    return (
      <Layout>
        <div className="py-8">
          <PricingContent />
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StackVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <PricingContent />
        </div>
      </main>

      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">StackVault</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <Link to="/auth" className="hover:text-foreground">Login</Link>
              <Link to="/auth" className="hover:text-foreground">Get Started</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StackVault. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
