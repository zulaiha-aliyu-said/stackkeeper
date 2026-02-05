 import { useMemo, useCallback } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { Tool, SortOption, Category, UsageEntry } from '@/types/tool';
 import { calculateROI } from '@/lib/roi';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 import type { Database } from '@/integrations/supabase/database.types';

export function useTools() {
   const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['tools', user?.id],
    queryFn: async () => {
      if (!user) return [];
       
       const { data, error } = await supabase
         .from('tools')
         .select('*')
         .eq('user_id', user.id)
         .order('added_date', { ascending: false });
 
       if (error) throw error;
 
       // Transform database columns to camelCase for frontend
       return (data || []).map(transformToolFromDb);
    },
     enabled: !!user && !!session,
  });

  const addToolMutation = useMutation({
    mutationFn: async (newTool: any) => {
       if (!user) throw new Error('Not authenticated');
 
       const dbTool = {
         user_id: user.id,
         name: newTool.name,
         category: newTool.category,
         platform: newTool.platform,
         price: newTool.price,
         purchase_date: newTool.purchaseDate || null,
         login: newTool.login || null,
         password: newTool.password || null,
         redemption_code: newTool.redemptionCode || null,
         notes: newTool.notes || null,
         tags: newTool.tags || null,
         tool_url: newTool.toolUrl || null,
         usage_goal: newTool.usageGoal || null,
         usage_goal_period: newTool.usageGoalPeriod || null,
         annual_value: newTool.annualValue || null,
       };
 
       const { data, error } = await supabase
         .from('tools')
         .insert(dbTool)
         .select()
         .single();
 
       if (error) throw error;
       return transformToolFromDb(data);
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
       const dbUpdates: any = {};
       if (updates.name !== undefined) dbUpdates.name = updates.name;
       if (updates.category !== undefined) dbUpdates.category = updates.category;
       if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
       if (updates.price !== undefined) dbUpdates.price = updates.price;
       if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
       if (updates.login !== undefined) dbUpdates.login = updates.login;
       if (updates.password !== undefined) dbUpdates.password = updates.password;
       if (updates.redemptionCode !== undefined) dbUpdates.redemption_code = updates.redemptionCode;
       if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
       if (updates.lastUsed !== undefined) dbUpdates.last_used = updates.lastUsed;
       if (updates.timesUsed !== undefined) dbUpdates.times_used = updates.timesUsed;
       if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
       if (updates.toolUrl !== undefined) dbUpdates.tool_url = updates.toolUrl;
       if (updates.usageHistory !== undefined) dbUpdates.usage_history = updates.usageHistory;
       if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
       if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
       if (updates.usageGoal !== undefined) dbUpdates.usage_goal = updates.usageGoal;
       if (updates.usageGoalPeriod !== undefined) dbUpdates.usage_goal_period = updates.usageGoalPeriod;
       if (updates.annualValue !== undefined) dbUpdates.annual_value = updates.annualValue;
       dbUpdates.updated_at = new Date().toISOString();
 
       const { data, error } = await supabase
         .from('tools')
         .update(dbUpdates)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return transformToolFromDb(data);
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
       const { error } = await supabase
         .from('tools')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
       return { id };
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
       // First get current tool data
        const { data: currentToolData, error: fetchError } = await supabase
         .from('tools')
         .select('*')
         .eq('id', id)
         .single();
 
       if (fetchError) throw fetchError;
        if (!currentToolData) throw new Error('Tool not found');
 
        const currentTool = currentToolData as Database['public']['Tables']['tools']['Row'];
 
       const now = new Date().toISOString();
       const usageEntry: UsageEntry = {
         id: crypto.randomUUID(),
         timestamp: now,
         duration,
         source: source as UsageEntry['source'],
       };
 
        const existingHistory = (currentTool.usage_history as unknown as UsageEntry[]) || [];
       const newHistory = [...existingHistory, usageEntry];
 
        const { data: updatedData, error } = await supabase
         .from('tools')
         .update({
           last_used: now,
           times_used: (currentTool.times_used || 0) + 1,
           usage_history: newHistory as any,
           updated_at: now,
         })
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
        return transformToolFromDb(updatedData);
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
 
 // Helper function to transform database snake_case to camelCase
 function transformToolFromDb(dbTool: any): Tool {
   return {
     id: dbTool.id,
     name: dbTool.name,
     category: dbTool.category,
     platform: dbTool.platform,
     price: dbTool.price,
     purchaseDate: dbTool.purchase_date || '',
     login: dbTool.login || undefined,
     password: dbTool.password || undefined,
     redemptionCode: dbTool.redemption_code || undefined,
     notes: dbTool.notes || undefined,
     addedDate: dbTool.added_date,
     lastUsed: dbTool.last_used,
     timesUsed: dbTool.times_used || 0,
     tags: dbTool.tags || undefined,
     toolUrl: dbTool.tool_url || undefined,
     usageHistory: dbTool.usage_history || undefined,
     currentStreak: dbTool.current_streak || 0,
     longestStreak: dbTool.longest_streak || 0,
     usageGoal: dbTool.usage_goal || undefined,
     usageGoalPeriod: dbTool.usage_goal_period || undefined,
     annualValue: dbTool.annual_value || undefined,
   };
 }
