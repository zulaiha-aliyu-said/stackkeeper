import { useState, useMemo } from 'react';
import { Search, Plus, Filter, ArrowUpDown, Download, AlertTriangle, Tag, Mail, GitCompare, CheckSquare, Square } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/EmptyState';
import { AddToolModal } from '@/components/AddToolModal';
import { ToolDetailModal } from '@/components/ToolDetailModal';
import { EmailImportModal } from '@/components/EmailImportModal';
import { CompareToolsModal } from '@/components/CompareToolsModal';
import { useTools } from '@/hooks/useTools';
import { Tool, CATEGORIES, Category, SortOption, SORT_OPTIONS } from '@/types/tool';
import { toast } from 'sonner';

export default function Library() {
  const { tools, addTool, updateTool, deleteTool, markAsUsed, logTimerUsage, sortTools, exportToCSV, getDuplicates, getAllTags } = useTools();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Tool[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);

  const filteredAndSortedTools = useMemo(() => {
    const filtered = tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
      const matchesTag = tagFilter === 'All' || (tool.tags || []).includes(tagFilter);
      return matchesSearch && matchesCategory && matchesTag;
    });
    return sortTools(filtered, sortBy);
  }, [tools, searchQuery, categoryFilter, tagFilter, sortBy, sortTools]);

  const handleExport = () => {
    if (tools.length === 0) {
      toast.error('No tools to export');
      return;
    }
    exportToCSV();
    toast.success('Tools exported to CSV');
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tool Library</h1>
            <p className="text-muted-foreground mt-1">{tools.length} tools in your vault</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isCompareMode ? (
              <>
                <button
                  onClick={() => { setIsCompareMode(false); setSelectedForCompare([]); }}
                  className="btn-secondary flex items-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  disabled={selectedForCompare.length < 2}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <GitCompare className="h-5 w-5" />
                  Compare ({selectedForCompare.length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsCompareMode(true)}
                  className="btn-secondary flex items-center gap-2"
                  title="Compare Tools"
                >
                  <GitCompare className="h-5 w-5" />
                  <span className="hidden sm:inline">Compare</span>
                </button>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn-secondary flex items-center gap-2"
                  title="Import from Email"
                >
                  <Mail className="h-5 w-5" />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button
                  onClick={handleExport}
                  className="btn-secondary flex items-center gap-2"
                  title="Export to CSV"
                >
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Tool
                </button>
              </>
            )}
          </div>
        </div>

        {/* Duplicate Detection Warning */}
        {getDuplicates.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-warning">Duplicate Tools Detected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You have multiple tools in the same category:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getDuplicates.map(({ category, tools: catTools }) => (
                    <span key={category} className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-md">
                      {category}: {catTools.length} tools
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search, Filters & Sort */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, category, or tag..."
              className="input-field w-full pl-12"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
                className="input-field pl-10 pr-8 min-w-[160px]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {getAllTags.length > 0 && (
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="input-field pl-10 pr-8 min-w-[140px]"
                >
                  <option value="All">All Tags</option>
                  {getAllTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input-field pl-10 pr-8 min-w-[160px]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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
        ) : filteredAndSortedTools.length === 0 ? (
          <EmptyState
            title="No tools found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTools.map((tool, index) => {
              const isSelected = selectedForCompare.some(t => t.id === tool.id);
              return (
                <div 
                  key={tool.id} 
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in relative"
                >
                  {isCompareMode && (
                    <button
                      onClick={() => {
                        if (isSelected) {
                          setSelectedForCompare(prev => prev.filter(t => t.id !== tool.id));
                        } else if (selectedForCompare.length < 3) {
                          setSelectedForCompare(prev => [...prev, tool]);
                        } else {
                          toast.error('You can compare up to 3 tools');
                        }
                      }}
                      className={`absolute top-2 left-2 z-10 p-1.5 rounded-lg transition-colors ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary/80 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                  )}
                  <ToolCard
                    tool={tool}
                    onViewDetails={isCompareMode ? () => {} : setSelectedTool}
                    onMarkAsUsed={markAsUsed}
                    onLogTimerUsage={logTimerUsage}
                  />
                </div>
              );
            })}
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
        existingTags={getAllTags}
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

      <EmailImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={addTool}
      />

      <CompareToolsModal
        isOpen={isCompareModalOpen}
        onClose={() => { setIsCompareModalOpen(false); setIsCompareMode(false); setSelectedForCompare([]); }}
        tools={selectedForCompare}
      />
    </Layout>
  );
}
