import { useState, useMemo } from 'react';
import { Tool } from '@/types/tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles,
  Package,
  Trash2
} from 'lucide-react';

interface WhatIfCalculatorProps {
  tools: Tool[];
}

export function WhatIfCalculator({ tools }: WhatIfCalculatorProps) {
  const [selectedForRefund, setSelectedForRefund] = useState<string[]>([]);
  const [newToolPrice, setNewToolPrice] = useState<string>('');
  const [newToolName, setNewToolName] = useState<string>('');

  const unusedTools = tools.filter(t => t.lastUsed === null);
  const usedTools = tools.filter(t => t.lastUsed !== null);

  const currentStats = useMemo(() => {
    const totalSpent = tools.reduce((sum, t) => sum + t.price, 0);
    const usedValue = usedTools.reduce((sum, t) => sum + t.price, 0);
    const unusedValue = unusedTools.reduce((sum, t) => sum + t.price, 0);
    const healthScore = tools.length > 0 ? Math.round((usedTools.length / tools.length) * 100) : 0;
    return { totalSpent, usedValue, unusedValue, healthScore, toolCount: tools.length };
  }, [tools, usedTools, unusedTools]);

  // Scenario 1: Refund selected unused tools
  const refundScenario = useMemo(() => {
    const refundValue = selectedForRefund.reduce((sum, id) => {
      const tool = tools.find(t => t.id === id);
      return sum + (tool?.price || 0);
    }, 0);
    
    const newTotal = currentStats.totalSpent - refundValue;
    const newToolCount = currentStats.toolCount - selectedForRefund.length;
    const newUsedCount = usedTools.length;
    const newHealthScore = newToolCount > 0 ? Math.round((newUsedCount / newToolCount) * 100) : 0;
    
    return {
      savings: refundValue,
      newTotal,
      newToolCount,
      newHealthScore,
      healthImprovement: newHealthScore - currentStats.healthScore,
    };
  }, [selectedForRefund, tools, currentStats, usedTools]);

  // Scenario 2: Buy a new tool
  const newToolScenario = useMemo(() => {
    const price = parseFloat(newToolPrice) || 0;
    const newTotal = currentStats.totalSpent + price;
    const newToolCount = currentStats.toolCount + 1;
    
    // Predict usage based on price patterns
    const avgUsedPrice = usedTools.length > 0 
      ? usedTools.reduce((sum, t) => sum + t.price, 0) / usedTools.length 
      : 50;
    const avgUnusedPrice = unusedTools.length > 0 
      ? unusedTools.reduce((sum, t) => sum + t.price, 0) / unusedTools.length 
      : 100;
    
    // Simple prediction: if price is closer to used tools' avg, higher chance of use
    const usedPriceDiff = Math.abs(price - avgUsedPrice);
    const unusedPriceDiff = Math.abs(price - avgUnusedPrice);
    const predictedUsage = Math.min(90, Math.max(30, 
      60 + (unusedPriceDiff - usedPriceDiff) / 2
    ));
    
    // Check for similar tools
    const similarTools = tools.filter(t => 
      t.price >= price * 0.7 && t.price <= price * 1.3
    );
    
    return {
      newTotal,
      newToolCount,
      predictedUsage: Math.round(predictedUsage),
      hasSimilar: similarTools.length > 0,
      similarTools,
      recommendation: predictedUsage >= 60 ? 'buy' : predictedUsage >= 45 ? 'wait' : 'skip',
    };
  }, [newToolPrice, tools, currentStats, usedTools, unusedTools]);

  // Scenario 3: Refund ALL unused tools
  const refundAllScenario = useMemo(() => {
    const totalRefund = unusedTools.reduce((sum, t) => sum + t.price, 0);
    const newTotal = currentStats.totalSpent - totalRefund;
    const newHealthScore = 100;
    
    return {
      savings: totalRefund,
      newTotal,
      toolsToRefund: unusedTools.length,
      newHealthScore,
    };
  }, [unusedTools, currentStats]);

  const toggleRefundSelection = (id: string) => {
    setSelectedForRefund(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllUnused = () => {
    setSelectedForRefund(unusedTools.map(t => t.id));
  };

  const clearSelection = () => {
    setSelectedForRefund([]);
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="border-b border-border bg-gradient-to-r from-info/10 via-info/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-info/20 p-2">
            <Calculator className="h-5 w-5 text-info" />
          </div>
          <div>
            <CardTitle className="text-lg">What If Calculator</CardTitle>
            <p className="text-sm text-muted-foreground">Explore scenarios before making decisions</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="refund" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="refund" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Refund Tools</span>
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">New Purchase</span>
            </TabsTrigger>
            <TabsTrigger value="optimize" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Optimize All</span>
            </TabsTrigger>
          </TabsList>

          {/* Refund Scenario */}
          <TabsContent value="refund" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select unused tools to refund:</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllUnused}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>

              {unusedTools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>Amazing! All your tools are being used.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {unusedTools.map(tool => (
                    <div
                      key={tool.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedForRefund.includes(tool.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleRefundSelection(tool.id)}
                    >
                      <Checkbox
                        checked={selectedForRefund.includes(tool.id)}
                        onCheckedChange={() => toggleRefundSelection(tool.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.category}</p>
                      </div>
                      <Badge variant="secondary">${tool.price}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedForRefund.length > 0 && (
              <div className="bg-gradient-to-r from-success/10 to-success/5 rounded-lg p-6 border border-success/20 animate-fade-in">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  If you refund {selectedForRefund.length} tools:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">+${refundScenario.savings}</div>
                    <div className="text-xs text-muted-foreground">Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">${refundScenario.newTotal.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">New Total Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{refundScenario.newHealthScore}%</div>
                    <div className="text-xs text-muted-foreground">New Health Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${refundScenario.healthImprovement > 0 ? 'text-success' : 'text-foreground'}`}>
                      {refundScenario.healthImprovement > 0 ? '+' : ''}{refundScenario.healthImprovement}%
                    </div>
                    <div className="text-xs text-muted-foreground">Health Improvement</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Buy New Tool Scenario */}
          <TabsContent value="buy" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tool-name">Tool Name (optional)</Label>
                <Input
                  id="tool-name"
                  placeholder="e.g., New CRM Tool"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-price">Tool Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tool-price"
                    type="number"
                    placeholder="99"
                    className="pl-9"
                    value={newToolPrice}
                    onChange={(e) => setNewToolPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {parseFloat(newToolPrice) > 0 && (
              <div className={`rounded-lg p-6 border animate-fade-in ${
                newToolScenario.recommendation === 'buy' 
                  ? 'bg-gradient-to-r from-success/10 to-success/5 border-success/20'
                  : newToolScenario.recommendation === 'wait'
                  ? 'bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20'
                  : 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20'
              }`}>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  {newToolScenario.recommendation === 'buy' && <CheckCircle2 className="h-5 w-5 text-success" />}
                  {newToolScenario.recommendation === 'wait' && <AlertTriangle className="h-5 w-5 text-warning" />}
                  {newToolScenario.recommendation === 'skip' && <TrendingDown className="h-5 w-5 text-destructive" />}
                  If you buy {newToolName || 'this tool'} for ${newToolPrice}:
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">${newToolScenario.newTotal.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">New Total Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{newToolScenario.predictedUsage}%</div>
                    <div className="text-xs text-muted-foreground">Predicted Usage</div>
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant={
                        newToolScenario.recommendation === 'buy' ? 'default' :
                        newToolScenario.recommendation === 'wait' ? 'secondary' : 'destructive'
                      }
                      className="text-sm"
                    >
                      {newToolScenario.recommendation === 'buy' && '✅ Good Buy'}
                      {newToolScenario.recommendation === 'wait' && '⚠️ Consider Waiting'}
                      {newToolScenario.recommendation === 'skip' && '❌ Skip It'}
                    </Badge>
                  </div>
                </div>

                {newToolScenario.hasSimilar && (
                  <div className="bg-background/50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 inline mr-1 text-warning" />
                      You already own {newToolScenario.similarTools.length} tool(s) in a similar price range:
                      {' '}{newToolScenario.similarTools.slice(0, 3).map(t => t.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Optimize All Scenario */}
          <TabsContent value="optimize" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What if you refund ALL unused tools?
              </h4>
              
              {refundAllScenario.toolsToRefund === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p className="text-muted-foreground">Your stack is already 100% optimized!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">+${refundAllScenario.savings.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">${refundAllScenario.newTotal.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">New Total Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">{refundAllScenario.toolsToRefund}</div>
                    <div className="text-xs text-muted-foreground">Tools to Refund</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{refundAllScenario.newHealthScore}%</div>
                    <div className="text-xs text-muted-foreground">New Health Score</div>
                  </div>
                </div>
              )}
            </div>

            {/* Unused tools list */}
            {refundAllScenario.toolsToRefund > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Unused tools to consider refunding:</h4>
                <div className="flex flex-wrap gap-2">
                  {unusedTools.map(tool => (
                    <Badge key={tool.id} variant="outline" className="py-1.5 px-3">
                      {tool.name} - ${tool.price}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
