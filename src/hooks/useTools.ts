import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tool, SortOption, Category, UsageEntry } from '@/types/tool';
import { calculateROI } from '@/lib/roi';
import { calculateStreak } from '@/lib/streaks';

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

  const markAsUsed = (id: string, source: UsageEntry['source'] = 'manual', duration?: number) => {
    const now = new Date().toISOString();
    const newEntry: UsageEntry = {
      id: crypto.randomUUID(),
      timestamp: now,
      source,
      duration,
    };

    setTools(prev => prev.map(tool => {
      if (tool.id !== id) return tool;
      
      const updatedHistory = [...(tool.usageHistory || []), newEntry];
      const streakInfo = calculateStreak(updatedHistory, now);
      
      return {
        ...tool,
        lastUsed: now,
        timesUsed: tool.timesUsed + 1,
        usageHistory: updatedHistory,
        currentStreak: streakInfo.currentStreak,
        longestStreak: Math.max(tool.longestStreak || 0, streakInfo.longestStreak),
      };
    }));
  };

  // Bulk mark tools as used (for daily prompt)
  const bulkMarkAsUsed = useCallback((toolIds: string[]) => {
    const now = new Date().toISOString();
    
    setTools(prev => prev.map(tool => {
      if (!toolIds.includes(tool.id)) return tool;
      
      const newEntry: UsageEntry = {
        id: crypto.randomUUID(),
        timestamp: now,
        source: 'daily-prompt',
      };
      
      const updatedHistory = [...(tool.usageHistory || []), newEntry];
      const streakInfo = calculateStreak(updatedHistory, now);
      
      return {
        ...tool,
        lastUsed: now,
        timesUsed: tool.timesUsed + 1,
        usageHistory: updatedHistory,
        currentStreak: streakInfo.currentStreak,
        longestStreak: Math.max(tool.longestStreak || 0, streakInfo.longestStreak),
      };
    }));
  }, []);

  // Log usage with timer
  const logTimerUsage = useCallback((id: string, duration: number) => {
    markAsUsed(id, 'timer', duration);
  }, []);

  const getTool = (id: string) => tools.find(tool => tool.id === id);

  // Sorting function
  const sortTools = (toolsToSort: Tool[], sortBy: SortOption): Tool[] => {
    return [...toolsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'date-newest':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'date-oldest':
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        case 'usage':
          return b.timesUsed - a.timesUsed;
        default:
          return 0;
      }
    });
  };

  // Duplicate detection - tools in the same category
  const getDuplicates = useMemo(() => {
    const categoryGroups: Record<Category, Tool[]> = {} as Record<Category, Tool[]>;
    tools.forEach(tool => {
      if (!categoryGroups[tool.category]) {
        categoryGroups[tool.category] = [];
      }
      categoryGroups[tool.category].push(tool);
    });
    
    const duplicates: { category: Category; tools: Tool[] }[] = [];
    Object.entries(categoryGroups).forEach(([category, categoryTools]) => {
      if (categoryTools.length > 1) {
        duplicates.push({ category: category as Category, tools: categoryTools });
      }
    });
    return duplicates;
  }, [tools]);

  // Export to CSV with ROI data
  const exportToCSV = () => {
    const headers = [
      'Name',
      'Category',
      'Platform',
      'Price',
      'Purchase Date',
      'Login',
      'Redemption Code',
      'Notes',
      'Times Used',
      'Last Used',
      'Tags',
      'Cost Per Use',
      'ROI Status'
    ];
    
    const csvRows = [
      headers.join(','),
      ...tools.map(tool => {
        const roi = calculateROI(tool);
        return [
          `"${tool.name.replace(/"/g, '""')}"`,
          tool.category,
          tool.platform,
          tool.price,
          tool.purchaseDate.split('T')[0],
          `"${(tool.login || '').replace(/"/g, '""')}"`,
          `"${(tool.redemptionCode || '').replace(/"/g, '""')}"`,
          `"${(tool.notes || '').replace(/"/g, '""')}"`,
          tool.timesUsed,
          tool.lastUsed ? tool.lastUsed.split('T')[0] : '',
          `"${(tool.tags || []).join(', ')}"`,
          roi.costPerUse !== null ? roi.costPerUse.toFixed(2) : 'N/A',
          roi.statusLabel
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stackvault_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Get all unique tags
  const getAllTags = useMemo(() => {
    const tagSet = new Set<string>();
    tools.forEach(tool => {
      (tool.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tools]);

  const activeToolsValue = usedTools.reduce((sum, tool) => sum + tool.price, 0);
  const unusedToolsValue = unusedTools.reduce((sum, tool) => sum + tool.price, 0);

  return {
    tools,
    isLoading,
    addTool,
    updateTool,
    deleteTool,
    markAsUsed,
    bulkMarkAsUsed,
    logTimerUsage,
    getTool,
    sortTools,
    exportToCSV,
    getDuplicates,
    getAllTags,
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
