import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Swords, Trophy, Share2, Crown, ArrowLeft, 
  Target, Copy, Check 
} from 'lucide-react';
import { BattleStack, BattleResult } from '@/types/profile';
import { toast } from 'sonner';

const compareBattleStacks = (challenger: BattleStack, challenged: BattleStack): BattleResult => {
  const metrics = [
    {
      name: 'Stack Score',
      challengerValue: challenger.stackScore,
      challengedValue: challenged.stackScore,
      winner: challenger.stackScore > challenged.stackScore ? 'challenger' as const : 
              challenged.stackScore > challenger.stackScore ? 'challenged' as const : 'tie' as const,
    },
    {
      name: 'Health Score',
      challengerValue: challenger.healthScore,
      challengedValue: challenged.healthScore,
      winner: challenger.healthScore > challenged.healthScore ? 'challenger' as const : 
              challenged.healthScore > challenger.healthScore ? 'challenged' as const : 'tie' as const,
    },
    {
      name: 'ROI Efficiency',
      challengerValue: challenger.avgROI,
      challengedValue: challenged.avgROI,
      winner: challenger.avgROI > challenged.avgROI ? 'challenger' as const : 
              challenged.avgROI > challenger.avgROI ? 'challenged' as const : 'tie' as const,
    },
    {
      name: 'Tool Collection',
      challengerValue: challenger.toolCount,
      challengedValue: challenged.toolCount,
      winner: challenger.toolCount > challenged.toolCount ? 'challenger' as const : 
              challenged.toolCount > challenged.toolCount ? 'challenged' as const : 'tie' as const,
    },
  ];

  const challengerWins = metrics.filter(m => m.winner === 'challenger').length;
  const challengedWins = metrics.filter(m => m.winner === 'challenged').length;
  
  const overallWinner = challengerWins > challengedWins ? 'challenger' as const : 
                        challengedWins > challengerWins ? 'challenged' as const : 'tie' as const;

  return {
    winner: overallWinner === 'challenger' ? challenger : challenged,
    loser: overallWinner === 'challenger' ? challenged : challenger,
    metrics,
    overallWinner,
  };
};

export default function BattleChallenge() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [challengeCode, setChallengeCode] = useState(codeFromUrl);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [challengerStack, setChallengerStack] = useState<BattleStack | null>(null);
  const [copied, setCopied] = useState(false);

  const handleViewChallenge = () => {
    if (!challengeCode.startsWith('BATTLE-')) {
      toast.error('Invalid challenge code. It should start with BATTLE-');
      return;
    }

    try {
      const data = challengeCode.replace('BATTLE-', '');
      const stack = JSON.parse(atob(data)) as BattleStack;
      setChallengerStack(stack);
      setBattleResult(null);
      toast.success(`Challenge from ${stack.displayName} loaded!`);
    } catch {
      toast.error('Invalid challenge code format');
    }
  };

  const handleAcceptBattle = () => {
    if (!challengerStack) return;

    // Get user's stack from localStorage
    const storedTools = localStorage.getItem('stackvault_tools');
    const storedProfile = localStorage.getItem('stackvault_profile');
    
    if (!storedTools) {
      toast.error('You need tools in your stack to battle! Add some tools first.');
      return;
    }

    try {
      const tools = JSON.parse(storedTools);
      const profile = storedProfile ? JSON.parse(storedProfile) : { username: 'You', displayName: 'You' };
      
      // Calculate user's stack metrics
      const usedTools = tools.filter((t: { lastUsed: string | null }) => t.lastUsed !== null);
      const stackScore = tools.length > 0 ? Math.round((usedTools.length / tools.length) * 100) : 0;
      const unusedPercentage = tools.length > 0 ? (tools.filter((t: { lastUsed: string | null }) => !t.lastUsed).length / tools.length) * 100 : 0;
      const healthScore = Math.max(0, Math.min(100, 100 - unusedPercentage * 0.8));
      
      const myStack: BattleStack = {
        username: profile.username || 'You',
        displayName: profile.displayName || 'You',
        toolCount: tools.length,
        totalInvestment: tools.reduce((sum: number, t: { price: number }) => sum + t.price, 0),
        stackScore,
        healthScore: Math.round(healthScore),
        avgROI: 50, // Simplified for demo
        topCategories: [],
      };

      const result = compareBattleStacks(challengerStack, myStack);
      setBattleResult(result);
      
      if (result.overallWinner === 'challenged') {
        toast.success('🏆 You won the battle!');
      } else if (result.overallWinner === 'challenger') {
        toast.info('Your opponent won this round!');
      } else {
        toast.info("It's a tie!");
      }
    } catch {
      toast.error('Error loading your stack');
    }
  };

  const handleShareResult = () => {
    if (!battleResult) return;
    const text = `⚔️ Stack Battle Results!\n\n🏆 Winner: ${battleResult.winner.displayName}\n\nStats:\n• Stack Score: ${battleResult.winner.stackScore}%\n• Health Score: ${battleResult.winner.healthScore}%\n• Tools: ${battleResult.winner.toolCount}\n\nChallenge your friends at StackVault!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Battle results copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/battles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Battles
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Swords className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Battle Challenge</h1>
          </div>
          <p className="text-muted-foreground">
            Enter a challenge code from a friend to see their stack and battle!
          </p>
        </div>

        {/* Input Challenge Code */}
        {!battleResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Enter Challenge Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Paste challenge code here (BATTLE-...)"
                value={challengeCode}
                onChange={(e) => setChallengeCode(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleViewChallenge} 
                className="w-full gap-2"
                disabled={!challengeCode}
              >
                <Swords className="h-4 w-4" />
                View Challenge
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Challenger Stack Preview */}
        {challengerStack && !battleResult && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Challenge from {challengerStack.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-primary">{challengerStack.stackScore}%</div>
                  <div className="text-xs text-muted-foreground">Stack Score</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-green-500">{challengerStack.healthScore}%</div>
                  <div className="text-xs text-muted-foreground">Health Score</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold">{challengerStack.toolCount}</div>
                  <div className="text-xs text-muted-foreground">Tools</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold">${challengerStack.totalInvestment.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Invested</div>
                </div>
              </div>

              <Button onClick={handleAcceptBattle} className="w-full gap-2" size="lg">
                <Swords className="h-5 w-5" />
                Accept Battle & Compare My Stack!
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Battle Results */}
        {battleResult && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Battle Results
                </div>
                <Button variant="outline" size="sm" onClick={handleShareResult} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Winner Banner */}
              <div className="text-center p-6 rounded-lg bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-500/20">
                <Crown className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {battleResult.overallWinner === 'tie' 
                    ? "It's a Tie!" 
                    : `${battleResult.winner.displayName} Wins!`}
                </div>
                {battleResult.overallWinner !== 'tie' && (
                  <Badge className="mt-3 bg-yellow-500/20 text-yellow-600 text-sm px-4 py-1">
                    🏆 Stack Champion
                  </Badge>
                )}
              </div>

              {/* Metrics Comparison */}
              <div className="space-y-4">
                {battleResult.metrics.map((metric) => (
                  <div key={metric.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={metric.winner === 'challenger' ? 'font-bold text-primary' : ''}>
                        {challengerStack?.displayName}: {metric.challengerValue}
                        {metric.name.includes('Score') || metric.name.includes('ROI') ? '%' : ''}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        {metric.name}
                        {metric.winner !== 'tie' && (
                          <Trophy className="h-3 w-3 text-yellow-500" />
                        )}
                      </span>
                      <span className={metric.winner === 'challenged' ? 'font-bold text-primary' : ''}>
                        You: {metric.challengedValue}
                        {metric.name.includes('Score') || metric.name.includes('ROI') ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Progress 
                        value={metric.challengerValue} 
                        className="h-2 flex-1 rotate-180" 
                      />
                      <Progress 
                        value={metric.challengedValue} 
                        className="h-2 flex-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setBattleResult(null);
                    setChallengerStack(null);
                    setChallengeCode('');
                  }}
                >
                  New Battle
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/battles">
                    <Swords className="h-4 w-4 mr-2" />
                    Create Your Challenge
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
