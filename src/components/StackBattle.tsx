import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Swords, Trophy, Share2, Copy, Crown, Zap, Target, TrendingUp, Check } from 'lucide-react';
import { Tool } from '@/types/tool';
import { BattleStack, BattleResult } from '@/types/profile';
import { calculateROI } from '@/lib/roi';
import { toast } from 'sonner';

interface StackBattleProps {
  tools: Tool[];
  username: string;
}

const calculateStackMetrics = (tools: Tool[], username: string, displayName: string): BattleStack => {
  const usedTools = tools.filter(t => t.lastUsed !== null);
  const stackScore = tools.length > 0 ? Math.round((usedTools.length / tools.length) * 100) : 0;
  
  const avgROI = tools.length > 0
    ? tools.reduce((sum, t) => {
        const roi = calculateROI(t);
        return sum + (roi.costPerUse !== null ? Math.max(0, 100 - roi.costPerUse) : 0);
      }, 0) / tools.length
    : 0;

  const categoryCount: Record<string, number> = {};
  tools.forEach(t => {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  // Calculate health score similar to StackHealthDoctor
  const unusedPercentage = tools.length > 0 ? (tools.filter(t => !t.lastUsed).length / tools.length) * 100 : 0;
  const healthScore = Math.max(0, Math.min(100, 100 - unusedPercentage * 0.8));

  return {
    username,
    displayName,
    toolCount: tools.length,
    totalInvestment: tools.reduce((sum, t) => sum + t.price, 0),
    stackScore,
    healthScore: Math.round(healthScore),
    avgROI: Math.round(avgROI),
    topCategories,
  };
};

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
              challenged.toolCount > challenger.toolCount ? 'challenged' as const : 'tie' as const,
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

export function StackBattle({ tools, username }: StackBattleProps) {
  const [challengeCode, setChallengeCode] = useState('');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [copied, setCopied] = useState(false);

  const myStack = useMemo(() => 
    calculateStackMetrics(tools, username, username || 'You'), 
    [tools, username]
  );

  const generateChallengeCode = () => {
    const data = btoa(JSON.stringify(myStack));
    return `BATTLE-${data}`;
  };

  const handleCreateChallenge = () => {
    setShowCreateChallenge(true);
  };

  const handleCopyChallenge = () => {
    const code = generateChallengeCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Challenge code copied! Share it with a friend.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptChallenge = () => {
    if (!challengeCode.startsWith('BATTLE-')) {
      toast.error('Invalid challenge code');
      return;
    }

    try {
      const data = challengeCode.replace('BATTLE-', '');
      const challengerStack = JSON.parse(atob(data)) as BattleStack;
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
      toast.error('Invalid challenge code format');
    }
  };

  const handleShareResult = () => {
    if (!battleResult) return;
    const text = `⚔️ Stack Battle Results!\n\n🏆 Winner: ${battleResult.winner.displayName}\n\nStats:\n• Stack Score: ${battleResult.winner.stackScore}%\n• Health Score: ${battleResult.winner.healthScore}%\n• Tools: ${battleResult.winner.toolCount}\n\nChallenge your friends at StackVault!`;
    navigator.clipboard.writeText(text);
    toast.success('Battle results copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Stack Battles</h2>
        </div>
        <p className="text-muted-foreground">
          Challenge a friend to compare stack efficiency. Winner gets bragging rights!
        </p>
      </div>

      {/* Your Stack Stats */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Your Battle Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-primary">{myStack.stackScore}%</div>
              <div className="text-xs text-muted-foreground">Stack Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-green-500">{myStack.healthScore}%</div>
              <div className="text-xs text-muted-foreground">Health Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold">{myStack.toolCount}</div>
              <div className="text-xs text-muted-foreground">Tools</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold">${myStack.totalInvestment.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Invested</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Create Challenge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Create Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a challenge code and share it with a friend to battle.
            </p>
            {showCreateChallenge ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all">
                  {generateChallengeCode().slice(0, 50)}...
                </div>
                <Button onClick={handleCopyChallenge} className="w-full gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Challenge Code'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleCreateChallenge} className="w-full gap-2">
                <Swords className="h-4 w-4" />
                Create Battle Challenge
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Accept Challenge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Accept Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste a challenge code from a friend to battle their stack.
            </p>
            <Input
              placeholder="Paste challenge code here..."
              value={challengeCode}
              onChange={(e) => setChallengeCode(e.target.value)}
            />
            <Button 
              onClick={handleAcceptChallenge} 
              variant="secondary" 
              className="w-full gap-2"
              disabled={!challengeCode}
            >
              <Swords className="h-4 w-4" />
              Accept & Battle!
            </Button>
          </CardContent>
        </Card>
      </div>

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
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Winner Banner */}
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-500/20">
              <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-xl font-bold">
                {battleResult.overallWinner === 'tie' 
                  ? "It's a Tie!" 
                  : `${battleResult.winner.displayName} Wins!`}
              </div>
              {battleResult.overallWinner !== 'tie' && (
                <Badge className="mt-2 bg-yellow-500/20 text-yellow-600">
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
                      {metric.challengerValue}
                      {metric.name.includes('Score') || metric.name.includes('ROI') ? '%' : ''}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      {metric.name}
                      {metric.winner !== 'tie' && (
                        <Trophy className="h-3 w-3 text-yellow-500" />
                      )}
                    </span>
                    <span className={metric.winner === 'challenged' ? 'font-bold text-primary' : ''}>
                      {metric.challengedValue}
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Challenger</span>
                    <span>You</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setBattleResult(null)}
              >
                New Battle
              </Button>
              <Button className="flex-1 gap-2" onClick={handleShareResult}>
                <TrendingUp className="h-4 w-4" />
                Share Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
