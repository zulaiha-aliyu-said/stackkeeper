import { useState, useMemo } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/EmptyState';
import { AddToolModal } from '@/components/AddToolModal';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { useTools } from '@/hooks/useTools';
import { Tool, CATEGORIES, Category } from '@/types/tool';

export default function Library() {
  const { tools, addTool, updateTool, deleteTool, markAsUsed } = useTools();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, categoryFilter]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tool Library</h1>
            <p className="text-muted-foreground mt-1">{tools.length} tools in your vault</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Tool
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name or category..."
              className="input-field w-full pl-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
              className="input-field pl-12 pr-8 min-w-[180px]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        {tools.length === 0 ? (
          <EmptyState
            title="Your library is empty"
            description="Add your first tool to start building your collection."
            action={{
              label: 'Add Your First Tool',
              onClick: () => setIsAddModalOpen(true)
            }}
          />
        ) : filteredTools.length === 0 ? (
          <EmptyState
            title="No tools found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool, index) => (
              <div 
                key={tool.id} 
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <ToolCard
                  tool={tool}
                  onViewDetails={setSelectedTool}
                  onMarkAsUsed={markAsUsed}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditTool(null);
        }}
        onAdd={addTool}
        editTool={editTool}
        onUpdate={updateTool}
      />

      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          onMarkAsUsed={(id) => {
            markAsUsed(id);
            setSelectedTool(tools.find(t => t.id === id) || null);
          }}
          onEdit={(tool) => {
            setEditTool(tool);
            setIsAddModalOpen(true);
          }}
          onDelete={deleteTool}
        />
      )}
    </Layout>
  );
}
