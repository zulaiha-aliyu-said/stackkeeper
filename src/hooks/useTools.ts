import { useState, useEffect } from 'react';
import { Tool } from '@/types/tool';

const STORAGE_KEY = 'stackvault_tools';

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTools(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored tools:', e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
    }
  }, [tools, isLoading]);

  const addTool = (tool: Omit<Tool, 'id' | 'addedDate' | 'lastUsed' | 'timesUsed'>) => {
    const newTool: Tool = {
      ...tool,
      id: crypto.randomUUID(),
      addedDate: new Date().toISOString(),
      lastUsed: null,
      timesUsed: 0,
    };
    setTools(prev => [...prev, newTool]);
    return newTool;
  };

  const updateTool = (id: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(tool => 
      tool.id === id ? { ...tool, ...updates } : tool
    ));
  };

  const deleteTool = (id: string) => {
    setTools(prev => prev.filter(tool => tool.id !== id));
  };

  const markAsUsed = (id: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === id 
        ? { ...tool, lastUsed: new Date().toISOString(), timesUsed: tool.timesUsed + 1 }
        : tool
    ));
  };

  const getTool = (id: string) => tools.find(tool => tool.id === id);

  // Computed values
  const totalInvestment = tools.reduce((sum, tool) => sum + tool.price, 0);
  
  const usedTools = tools.filter(tool => tool.lastUsed !== null);
  const unusedTools = tools.filter(tool => tool.lastUsed === null);
  
  const stackScore = tools.length > 0 
    ? Math.round((usedTools.length / tools.length) * 100) 
    : 0;

  const getRefundAlerts = () => {
    const now = new Date();
    return tools
      .map(tool => {
        const purchaseDate = new Date(tool.purchaseDate);
        const refundDeadline = new Date(purchaseDate);
        refundDeadline.setDate(refundDeadline.getDate() + 60);
        const daysRemaining = Math.ceil((refundDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { tool, daysRemaining };
      })
      .filter(({ daysRemaining }) => daysRemaining > 0 && daysRemaining <= 10)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const getRecentlyAdded = () => {
    return [...tools]
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 5);
  };

  const getToolGraveyard = () => {
    return tools.filter(tool => tool.lastUsed === null);
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, { count: number; spend: number }> = {};
    tools.forEach(tool => {
      if (!breakdown[tool.category]) {
        breakdown[tool.category] = { count: 0, spend: 0 };
      }
      breakdown[tool.category].count++;
      breakdown[tool.category].spend += tool.price;
    });
    return breakdown;
  };

  const getPlatformBreakdown = () => {
    const breakdown: Record<string, number> = {};
    tools.forEach(tool => {
      breakdown[tool.platform] = (breakdown[tool.platform] || 0) + 1;
    });
    return breakdown;
  };

  const activeToolsValue = usedTools.reduce((sum, tool) => sum + tool.price, 0);
  const unusedToolsValue = unusedTools.reduce((sum, tool) => sum + tool.price, 0);

  return {
    tools,
    isLoading,
    addTool,
    updateTool,
    deleteTool,
    markAsUsed,
    getTool,
    totalInvestment,
    usedTools,
    unusedTools,
    stackScore,
    activeToolsValue,
    unusedToolsValue,
    getRefundAlerts,
    getRecentlyAdded,
    getToolGraveyard,
    getCategoryBreakdown,
    getPlatformBreakdown,
  };
}
