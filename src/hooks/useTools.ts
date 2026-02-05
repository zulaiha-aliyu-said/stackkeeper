import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tool, SortOption, Category } from '@/types/tool';
import { calculateROI } from '@/lib/roi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useTools() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // API URL is handled by proxy in dev, but generally relative path is best
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['tools', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tools');
      return res.json();
    },
    enabled: !!user,
  });

  const addToolMutation = useMutation({
    mutationFn: async (newTool: any) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTool),
      });
      if (!res.ok) throw new Error('Failed to add tool');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool added successfully');
    },
    onError: () => {
      toast.error('Failed to add tool');
    }
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tool> }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update tool');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool updated');
    },
    onError: () => {
      toast.error('Failed to update tool');
    }
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tools/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete tool');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool deleted');
    },
    onError: () => {
      toast.error('Failed to delete tool');
    }
  });

  const addTool = (tool: Omit<Tool, 'id' | 'addedDate' | 'lastUsed' | 'timesUsed'>) => {
    addToolMutation.mutate(tool);
    // Return a temp object or handle async - the UI might expect an immediate return
    // converting to async/void signature usually requires UI updates
    return {} as Tool;
  };

  const updateTool = (id: string, updates: Partial<Tool>) => {
    updateToolMutation.mutate({ id, updates });
  };

  const deleteTool = (id: string) => {
    deleteToolMutation.mutate(id);
  };

  // Mock implementation for manual local manipulation if needed, or deprecate
  const setToolsDirectly = useCallback((newTools: Tool[]) => {
    // Ideally we don't do this anymore with react-query
    console.warn('setToolsDirectly is deprecated in API mode');
  }, []);

  const markAsUsedMutation = useMutation({
    mutationFn: async ({ id, source, duration }: { id: string; source: string; duration?: number }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tools/${id}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ source, duration }),
      });
      if (!res.ok) throw new Error('Failed to log usage');
      return res.json();
    },
    onSuccess: (updatedTool) => {
      // Update the tool in the cache
      queryClient.setQueryData(['tools', user?.id], (oldTools: Tool[] | undefined) => {
        if (!oldTools) return [updatedTool];
        return oldTools.map(t => t.id === updatedTool.id ? updatedTool : t);
      });
      toast.success('Usage logged');
    },
    onError: () => {
      toast.error('Failed to log usage');
    }
  });

  const markAsUsed = (id: string, source: 'manual' | 'timer' | 'extension' | 'daily-prompt' = 'manual', duration?: number) => {
    markAsUsedMutation.mutate({ id, source, duration });
  };

  const bulkMarkAsUsed = useCallback((toolIds: string[]) => {
    // TODO: Implement bulk usage API
  }, []);

  const logTimerUsage = useCallback((id: string, duration: number) => {
    markAsUsed(id, 'timer', duration);
  }, []);

  const getTool = (id: string) => tools.find((tool: Tool) => tool.id === id);

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
          return (b.timesUsed || 0) - (a.timesUsed || 0);
        default:
          return 0;
      }
    });
  };

  const getDuplicates = useMemo(() => {
    const categoryGroups: Record<Category, Tool[]> = {} as Record<Category, Tool[]>;
    tools.forEach((tool: Tool) => {
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

  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Platform', 'Price', 'Purchase Date',
      'Login', 'Redemption Code', 'Notes', 'Times Used', 'Last Used',
      'Tags', 'Cost Per Use', 'ROI Status'
    ];

    const csvRows = [
      headers.join(','),
      ...tools.map((tool: Tool) => {
        const roi = calculateROI(tool);
        return [
          `"${tool.name.replace(/"/g, '""')}"`,
          tool.category,
          tool.platform,
          tool.price,
          tool.purchaseDate ? tool.purchaseDate.split('T')[0] : '',
          `"${(tool.login || '').replace(/"/g, '""')}"`,
          `"${(tool.redemptionCode || '').replace(/"/g, '""')}"`,
          `"${(tool.notes || '').replace(/"/g, '""')}"`,
          tool.timesUsed || 0,
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

  const totalInvestment = tools.reduce((sum: number, tool: Tool) => sum + (Number(tool.price) || 0), 0);
  const usedTools = tools.filter((tool: Tool) => tool.lastUsed !== null);
  const unusedTools = tools.filter((tool: Tool) => tool.lastUsed === null);

  const stackScore = tools.length > 0
    ? Math.round((usedTools.length / tools.length) * 100)
    : 0;

  const getRefundAlerts = () => {
    const now = new Date();
    return tools
      .map((tool: Tool) => {
        if (!tool.purchaseDate) return { tool, daysRemaining: 0 };
        const purchaseDate = new Date(tool.purchaseDate);
        const refundDeadline = new Date(purchaseDate);
        refundDeadline.setDate(refundDeadline.getDate() + 60);
        const daysRemaining = Math.ceil((refundDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { tool, daysRemaining };
      })
      .filter(({ daysRemaining }: { daysRemaining: number }) => daysRemaining > 0 && daysRemaining <= 10)
      .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
  };

  const getRecentlyAdded = () => {
    return [...tools]
      .sort((a: Tool, b: Tool) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 5);
  };

  const getToolGraveyard = () => {
    return tools.filter((tool: Tool) => tool.lastUsed === null);
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, { count: number; spend: number }> = {};
    tools.forEach((tool: Tool) => {
      if (!breakdown[tool.category]) {
        breakdown[tool.category] = { count: 0, spend: 0 };
      }
      breakdown[tool.category].count++;
      breakdown[tool.category].spend += (Number(tool.price) || 0);
    });
    return breakdown;
  };

  const getPlatformBreakdown = () => {
    const breakdown: Record<string, number> = {};
    tools.forEach((tool: Tool) => {
      breakdown[tool.platform] = (breakdown[tool.platform] || 0) + 1;
    });
    return breakdown;
  };

  const getAllTags = useMemo(() => {
    const tagSet = new Set<string>();
    tools.forEach((tool: Tool) => {
      (tool.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tools]);

  const activeToolsValue = usedTools.reduce((sum: number, tool: Tool) => sum + (Number(tool.price) || 0), 0);
  const unusedToolsValue = unusedTools.reduce((sum: number, tool: Tool) => sum + (Number(tool.price) || 0), 0);

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
    setToolsDirectly,
  };
}
