import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Mail, MessageSquare, Send, CheckCircle2, ArrowRight, Github, Twitter, Globe, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';

function ContactForm() {
  const [state, handleSubmit] = useForm("xqegjlak");

  if (state.succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
        <p className="text-muted-foreground max-w-xs mx-auto mb-8">
          Thanks for reaching out! We've received your message and will get back to you as soon as possible.
        </p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email" 
            name="email"
            placeholder="you@example.com"
            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            required
          />
        </div>
        <ValidationError 
          prefix="Email" 
          field="email"
          errors={state.errors}
          className="text-sm text-destructive mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Your Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help you?"
          className="min-h-[150px] bg-background/50 border-border/50 focus:border-primary/50 transition-all resize-none"
          required
        />
        <ValidationError 
          prefix="Message" 
          field="message"
          errors={state.errors}
          className="text-sm text-destructive mt-1"
        />
      </div>

      <Button 
        type="submit" 
        disabled={state.submitting}
        className="w-full h-11 text-base font-medium gap-2 group relative overflow-hidden transition-all active:scale-[0.98]"
      >
        {state.submitting ? (
          <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <>
            <span>Send Message</span>
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </>
        )}
      </Button>
      
      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest pt-2">
        Powered by Formspree
      </p>
    </form>
  );
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-success/5 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[110px]" />
      </div>

      {/* Navigation Shortcut */}
      <nav className="relative z-50 border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Globe className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">StackVault</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Content */}
          <div className="space-y-10 animate-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium uppercase tracking-wider">
                Get in touch
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                Let's <span className="text-gradient">Connect</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Have questions about StackVault? We're here to help you get the most out of your tool collection.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email us</h3>
                  <p className="text-muted-foreground text-sm">Our friendly team is here to help.</p>
                  <a href="mailto:support@stackvault.io" className="text-primary hover:underline text-sm font-medium mt-1 inline-block">
                    support@stackvault.io
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Live Chat</h3>
                  <p className="text-muted-foreground text-sm">Available Monday to Friday, 9am-5pm.</p>
                  <button className="text-success hover:underline text-sm font-medium mt-1 inline-block">
                    Start a conversation
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Call us</h3>
                  <p className="text-muted-foreground text-sm">Mon-Fri from 8am to 5pm.</p>
                  <a href="tel:+1555000000" className="text-info hover:underline text-sm font-medium mt-1 inline-block">
                    +1 (555) 000-0000
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Social</h3>
                  <p className="text-muted-foreground text-sm">Follow us for updates and tips.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <a href="#" className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                      <Twitter className="h-4 w-4" />
                    </a>
                    <a href="#" className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                      <Github className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="animate-in slide-in-from-right duration-700">
            <Card className="border-border/40 shadow-2xl shadow-primary/5 bg-background/40 backdrop-blur-md overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary" />
              <CardContent className="p-8 sm:p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                  <p className="text-muted-foreground">We typically respond within 2-4 hours.</p>
                </div>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-border/50 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            © 2026 StackVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
