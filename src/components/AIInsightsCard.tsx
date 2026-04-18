import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { useTools } from '@/hooks/useTools';
import { generateInsights } from '@/lib/ai-advisor';

export function AIInsightsCard() {
  const { tools } = useTools();
  const [insights, setInsights] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGetInsights = () => {
    setInsights([]);
    setIsGenerating(true);
    // Simulate thinking time to mimic AI processing
    setTimeout(() => {
      const results = generateInsights(tools);
      setInsights(results);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-xl p-6 shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start">
        <div className="bg-blue-500/20 p-4 rounded-xl shrink-0">
          <Brain className="w-8 h-8 text-blue-400" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Smart AI ROI Advisor
              <Sparkles className="w-4 h-4 text-blue-400" />
            </h3>
            <p className="text-blue-200/70 text-sm mt-1">
              Your personal financial advisor for software investments. We analyze your stack to find wasted spend and highlight high-value tools.
            </p>
          </div>

          {insights.length === 0 ? (
            <button
              onClick={handleGetInsights}
              disabled={isGenerating || tools.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg shadow-sm shadow-blue-900/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Stack...
                </>
              ) : (
                <>
                  Get Insights
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="bg-black/20 rounded-lg p-5 border border-white/5 space-y-3 mt-4">
              <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">Analysis Results</h4>
              <ul className="space-y-3">
                {insights.map((insight, index) => {
                  let Icon = TrendingUp;
                  let iconColor = "text-green-400";
                  
                  if (insight.includes("wasted") || insight.includes("unused") || insight.includes("wasting")) {
                    Icon = AlertTriangle;
                    iconColor = "text-amber-400";
                  } else if (insight.toLowerCase().includes("cancel") || insight.toLowerCase().includes("warning") || insight.toLowerCase().includes("drastic")) {
                    Icon = AlertTriangle;
                    iconColor = "text-red-400";
                  }

                  return (
                    <li key={index} className="flex gap-3 text-sm text-gray-200 leading-relaxed">
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                      <span>{insight}</span>
                    </li>
                  )
                })}
              </ul>
              
              <div className="pt-3 mt-3 border-t border-white/10 flex justify-end">
                <button 
                  onClick={handleGetInsights} 
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Refresh Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
