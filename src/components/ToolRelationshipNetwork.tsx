import { useMemo, useState } from 'react';
import { Tool, Category } from '@/types/tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Circle, AlertTriangle, Zap, Users } from 'lucide-react';

interface ToolRelationshipNetworkProps {
  tools: Tool[];
}

interface ToolNode {
  tool: Tool;
  x: number;
  y: number;
  cluster: string;
  connections: string[];
}

// Define natural tool relationships based on categories and common workflows
const WORKFLOW_CONNECTIONS: Record<Category, Category[]> = {
  'Marketing': ['Design', 'Email', 'Analytics', 'AI'],
  'Design': ['Marketing', 'Video'],
  'Productivity': ['AI', 'Email'],
  'AI': ['Marketing', 'Productivity', 'Dev Tools', 'Email'],
  'Dev Tools': ['AI', 'Analytics'],
  'Analytics': ['Marketing', 'Dev Tools'],
  'Email': ['Marketing', 'AI', 'Productivity'],
  'Video': ['Design', 'Marketing'],
  'Other': [],
};

const CLUSTER_COLORS: Record<string, string> = {
  'Marketing Cluster': 'hsl(var(--primary))',
  'Development Cluster': 'hsl(var(--info))',
  'Productivity Cluster': 'hsl(var(--success))',
  'Creative Cluster': 'hsl(var(--warning))',
  'Orphan': 'hsl(var(--muted-foreground))',
};

function getCluster(category: Category): string {
  const marketingCategories: Category[] = ['Marketing', 'Email', 'Analytics'];
  const devCategories: Category[] = ['Dev Tools', 'AI'];
  const productivityCategories: Category[] = ['Productivity'];
  const creativeCategories: Category[] = ['Design', 'Video'];
  
  if (marketingCategories.includes(category)) return 'Marketing Cluster';
  if (devCategories.includes(category)) return 'Development Cluster';
  if (productivityCategories.includes(category)) return 'Productivity Cluster';
  if (creativeCategories.includes(category)) return 'Creative Cluster';
  return 'Orphan';
}

export function ToolRelationshipNetwork({ tools }: ToolRelationshipNetworkProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build network nodes with positions
  const { nodes, connections, clusters, orphanTools } = useMemo(() => {
    const nodeMap = new Map<string, ToolNode>();
    const allConnections: { from: string; to: string }[] = [];
    const clusterCounts: Record<string, number> = {};
    
    // First pass: create nodes and determine clusters
    tools.forEach((tool, index) => {
      const cluster = getCluster(tool.category);
      clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
      
      // Find connected tools based on workflow relationships
      const relatedCategories = WORKFLOW_CONNECTIONS[tool.category] || [];
      const connectedTools = tools.filter(t => 
        t.id !== tool.id && relatedCategories.includes(t.category)
      );
      
      nodeMap.set(tool.id, {
        tool,
        x: 0,
        y: 0,
        cluster,
        connections: connectedTools.map(t => t.id),
      });
    });

    // Second pass: build connections (avoiding duplicates)
    const connectionSet = new Set<string>();
    nodeMap.forEach((node, id) => {
      node.connections.forEach(connId => {
        const key = [id, connId].sort().join('-');
        if (!connectionSet.has(key)) {
          connectionSet.add(key);
          allConnections.push({ from: id, to: connId });
        }
      });
    });

    // Position nodes in clusters
    const clusterPositions: Record<string, { cx: number; cy: number; radius: number }> = {
      'Marketing Cluster': { cx: 200, cy: 200, radius: 120 },
      'Development Cluster': { cx: 500, cy: 150, radius: 80 },
      'Productivity Cluster': { cx: 400, cy: 350, radius: 100 },
      'Creative Cluster': { cx: 150, cy: 400, radius: 90 },
      'Orphan': { cx: 350, cy: 250, radius: 40 },
    };

    const clusterCounters: Record<string, number> = {};
    nodeMap.forEach((node) => {
      const pos = clusterPositions[node.cluster];
      const countInCluster = clusterCounters[node.cluster] || 0;
      clusterCounters[node.cluster] = countInCluster + 1;
      
      const totalInCluster = clusterCounts[node.cluster];
      const angle = (countInCluster / totalInCluster) * 2 * Math.PI - Math.PI / 2;
      const radiusOffset = pos.radius * (0.6 + Math.random() * 0.4);
      
      node.x = pos.cx + Math.cos(angle) * radiusOffset;
      node.y = pos.cy + Math.sin(angle) * radiusOffset;
    });

    // Find orphan tools (no connections)
    const orphans = Array.from(nodeMap.values()).filter(n => n.connections.length === 0);

    return {
      nodes: Array.from(nodeMap.values()),
      connections: allConnections,
      clusters: Object.entries(clusterCounts).filter(([k]) => k !== 'Orphan'),
      orphanTools: orphans,
    };
  }, [tools]);

  const selectedNodeData = selectedNode ? nodes.find(n => n.tool.id === selectedNode) : null;

  return (
    <div className="space-y-6">
      {/* Network Visualization */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/20 p-2">
                <Network className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">Tool Relationship Network</CardTitle>
                <p className="text-sm text-muted-foreground">Visualize how your tools connect and work together</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative bg-secondary/20" style={{ height: '500px' }}>
            <svg width="100%" height="100%" viewBox="0 0 700 500" className="overflow-visible">
              {/* Connections */}
              <g>
                {connections.map((conn, i) => {
                  const fromNode = nodes.find(n => n.tool.id === conn.from);
                  const toNode = nodes.find(n => n.tool.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to ||
                                        selectedNode === conn.from || selectedNode === conn.to;
                  
                  return (
                    <line
                      key={i}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 0.8 : 0.3}
                      className="transition-all duration-200"
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g>
                {nodes.map((node) => {
                  const isSelected = selectedNode === node.tool.id;
                  const isHovered = hoveredNode === node.tool.id;
                  const isConnected = selectedNode && 
                    (nodes.find(n => n.tool.id === selectedNode)?.connections.includes(node.tool.id) ||
                     node.connections.includes(selectedNode));
                  const isOrphan = node.connections.length === 0;
                  
                  const baseRadius = Math.min(20, 10 + node.tool.price / 50);
                  const radius = isSelected || isHovered ? baseRadius * 1.3 : baseRadius;
                  
                  return (
                    <g
                      key={node.tool.id}
                      className="cursor-pointer transition-transform duration-200"
                      onClick={() => setSelectedNode(isSelected ? null : node.tool.id)}
                      onMouseEnter={() => setHoveredNode(node.tool.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Glow effect */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 8}
                          fill={CLUSTER_COLORS[node.cluster]}
                          fillOpacity={0.2}
                        />
                      )}
                      
                      {/* Main circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={CLUSTER_COLORS[node.cluster]}
                        fillOpacity={selectedNode && !isSelected && !isConnected ? 0.3 : 0.9}
                        stroke={isOrphan ? 'hsl(var(--warning))' : 'hsl(var(--background))'}
                        strokeWidth={2}
                        strokeDasharray={isOrphan ? '3,3' : undefined}
                        className="transition-all duration-200"
                      />
                      
                      {/* Label */}
                      {(isSelected || isHovered || !selectedNode) && (
                        <text
                          x={node.x}
                          y={node.y + radius + 14}
                          textAnchor="middle"
                          className="text-[10px] fill-foreground font-medium pointer-events-none"
                          style={{ opacity: selectedNode && !isSelected && !isConnected ? 0.3 : 1 }}
                        >
                          {node.tool.name.length > 12 ? node.tool.name.slice(0, 10) + '...' : node.tool.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
              <p className="text-xs font-medium text-foreground mb-2">Clusters</p>
              <div className="flex flex-wrap gap-2">
                {clusters.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <Circle 
                      className="h-3 w-3" 
                      fill={CLUSTER_COLORS[name]}
                      stroke="none"
                    />
                    <span className="text-xs text-muted-foreground">{name.replace(' Cluster', '')} ({count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Tool Details */}
      {selectedNodeData && (
        <Card className="border-border bg-card animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedNodeData.tool.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{selectedNodeData.tool.category}</Badge>
                  <Badge variant="outline">${selectedNodeData.tool.price}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                ✕
              </Button>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Connected to:</span>
                <span className="font-medium text-foreground">
                  {selectedNodeData.connections.length} tools
                </span>
              </div>
              
              {selectedNodeData.connections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedNodeData.connections.map(connId => {
                    const connTool = tools.find(t => t.id === connId);
                    return connTool ? (
                      <Badge 
                        key={connId} 
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedNode(connId)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {connTool.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This tool is isolated - consider integrating it into workflows</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orphan Tools Alert */}
      {orphanTools.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Lonely Tools Detected</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  These tools don't connect to any workflow. Consider using them with other tools or refunding:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {orphanTools.map(node => (
                    <Badge key={node.tool.id} variant="outline" className="border-warning/50">
                      {node.tool.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Insights */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Workflow Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.filter(([_, count]) => count > 1).map(([name, count]) => (
              <div key={name} className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Circle 
                    className="h-4 w-4" 
                    fill={CLUSTER_COLORS[name]}
                    stroke="none"
                  />
                  <span className="font-medium text-foreground">{name.replace(' Cluster', '')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {count} tools working together
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {nodes
                    .filter(n => n.cluster === name)
                    .slice(0, 4)
                    .map(n => (
                      <Badge key={n.tool.id} variant="outline" className="text-xs">
                        {n.tool.name}
                      </Badge>
                    ))}
                  {nodes.filter(n => n.cluster === name).length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{nodes.filter(n => n.cluster === name).length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
