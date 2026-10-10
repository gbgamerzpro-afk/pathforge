'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant as _BV,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  Filter,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  Loader,
  Sparkles,
  BookOpen,
  FolderGit2,
  Award,
  Briefcase,
  MessageSquare,
  Flag,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Roadmap, UserProfile, NodeStatus, NodeType } from '@/lib/types';
import { layoutRoadmap, getPhaseColor } from '@/lib/layout';
import { computeProgress } from '@/lib/storage';
import { RoadmapNodeView, type RoadmapNodeData } from './roadmap-node';
import { NodeDetailPanel } from './node-detail-panel';
import { ReplanDialog } from './replan-dialog';

interface GraphWorkspaceProps {
  roadmap: Roadmap;
  profile: UserProfile;
  onRoadmapUpdate: (roadmap: Roadmap) => void;
  onReset: () => void;
}

const NODE_TYPES_ARRAY = [
  { type: 'skill' as NodeType, label: 'Skills', icon: BookOpen, color: 'var(--color-skill)' },
  { type: 'project' as NodeType, label: 'Projects', icon: FolderGit2, color: 'var(--color-project)' },
  { type: 'credential' as NodeType, label: 'Credentials', icon: Award, color: 'var(--color-credential)' },
  { type: 'role' as NodeType, label: 'Roles', icon: Briefcase, color: 'var(--color-role)' },
  { type: 'interview' as NodeType, label: 'Interviews', icon: MessageSquare, color: 'var(--color-interview)' },
  { type: 'milestone' as NodeType, label: 'Milestones', icon: Flag, color: 'var(--color-milestone)' },
];

const nodeTypes: NodeTypes = {
  roadmapNode: RoadmapNodeView,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: 'hsl(240 20% 35%)', strokeWidth: 2 },
};

function GraphInner({
  roadmap,
  profile,
  onRoadmapUpdate,
  onReset,
}: GraphWorkspaceProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [replanOpen, setReplanOpen] = useState(false);

  const { nodes: positionedNodes } = useMemo(() => layoutRoadmap(roadmap), [roadmap]);

  const progress = useMemo(() => computeProgress(roadmap), [roadmap]);

  const rfNodes: Node<RoadmapNodeData>[] = useMemo(() => {
    return positionedNodes.map((pn) => {
      const isMatch =
        (searchQuery === '' ||
          pn.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pn.data.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterType === 'all' || pn.data.type === filterType);

      return {
        id: pn.id,
        type: 'roadmapNode',
        position: pn.position,
        data: pn.data,
        hidden: !isMatch,
        selected: selectedNodeId === pn.id,
      };
    });
  }, [positionedNodes, searchQuery, filterType, selectedNodeId]);

  const rfEdges: Edge[] = useMemo(() => {
    return roadmap.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...defaultEdgeOptions,
      animated: roadmap.nodes.find((n) => n.id === e.source)?.status === 'completed' ||
        roadmap.nodes.find((n) => n.id === e.source)?.status === 'already_known',
      style: {
        ...defaultEdgeOptions.style,
        stroke:
          roadmap.nodes.find((n) => n.id === e.source)?.status === 'completed' ||
          roadmap.nodes.find((n) => n.id === e.source)?.status === 'already_known'
            ? 'hsl(160 60% 45%)'
            : 'hsl(240 20% 35%)',
      },
    }));
  }, [roadmap]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleStatusChange = useCallback(
    (nodeId: string, status: NodeStatus) => {
      const updatedNodes = roadmap.nodes.map((n) =>
        n.id === nodeId ? { ...n, status } : n
      );
      onRoadmapUpdate({ ...roadmap, nodes: updatedNodes });
    },
    [roadmap, onRoadmapUpdate]
  );

  const selectedNode = roadmap.nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground truncate">
                  {roadmap.targetRole}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {roadmap.targetCompanyType} · {roadmap.estimatedDurationWeeks} weeks
                </p>
              </div>
            </div>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Overall Progress</p>
                <p className="text-sm font-bold text-foreground">{progress.percentage}%</p>
              </div>
              <div className="w-24">
                <Progress value={progress.percentage} className="h-2" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {progress.completed}/{progress.total}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {progress.remainingHours}h left
            </div>
            <Button variant="outline" size="sm" onClick={() => setReplanOpen(true)}>
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Adjust Plan
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Graph area */}
      <div className="relative flex-1 min-h-0">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="hsl(240 20% 25%)"
          />
          <Controls
            showInteractive={false}
            className="!shadow-lg"
          />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as unknown as RoadmapNodeData;
              return data?.phaseColor ?? 'hsl(240 20% 30%)';
            }}
            nodeStrokeWidth={3}
            pannable
            zoomable
          />

          {/* Search and filter panel */}
          <Panel position="top-left" className="!m-3">
            <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes..."
                  className="h-8 w-40 pl-8 text-xs"
                  aria-label="Search nodes"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-32 text-xs" aria-label="Filter by type">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {NODE_TYPES_ARRAY.map((nt) => (
                    <SelectItem key={nt.type} value={nt.type}>
                      {nt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Panel>

          {/* Legend */}
          <Panel position="top-right" className="!m-3">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-[180px]">
              <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
              <div className="space-y-1.5">
                {NODE_TYPES_ARRAY.map((nt) => {
                  const Icon = nt.icon;
                  return (
                    <div key={nt.type} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${nt.color}20`, color: nt.color }}
                      >
                        <Icon className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-muted-foreground">{nt.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border mt-2 pt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  <span className="text-muted-foreground">Already Known</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Loader className="h-3 w-3 text-cyan-400" />
                  <span className="text-muted-foreground">In Progress</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Phase labels */}
          <Panel position="bottom-left" className="!m-3">
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-[220px]">
              <p className="text-xs font-semibold text-foreground mb-2">Phases</p>
              <div className="space-y-1.5">
                {[...roadmap.phases]
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((phase) => {
                    const phaseNodes = roadmap.nodes.filter((n) => n.phaseId === phase.id);
                    const phaseCompleted = phaseNodes.filter(
                      (n) => n.status === 'completed' || n.status === 'already_known'
                    ).length;
                    const isCurrent = progress.currentPhase?.id === phase.id;
                    return (
                      <div key={phase.id} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: getPhaseColor(phase.sequence) }}
                        />
                        <span className={isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {phase.title}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {phaseCompleted}/{phaseNodes.length}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Panel>

          {/* Next milestone suggestion */}
          {progress.nextNode && (
            <Panel position="bottom-right" className="!m-3">
              <div className="bg-card/90 backdrop-blur-sm border border-accent/30 rounded-lg p-3 shadow-lg max-w-[240px]">
                <p className="text-xs font-semibold text-accent mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Suggested Next
                </p>
                <p className="text-sm font-medium text-foreground mb-1">{progress.nextNode.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {progress.nextNode.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 mt-2 text-xs px-2"
                  onClick={() => setSelectedNodeId(progress.nextNode!.id)}
                >
                  View details →
                </Button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Personalized summary banner */}
      <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur-sm px-4 py-2">
        <p className="text-xs text-muted-foreground text-center line-clamp-1">
          <span className="text-foreground/80 font-medium">Summary:</span> {roadmap.personalizedSummary}
        </p>
      </div>

      {/* Node detail panel */}
      <NodeDetailPanel
        node={selectedNode}
        roadmap={roadmap}
        profile={profile}
        open={selectedNodeId !== null}
        onClose={() => setSelectedNodeId(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Replan dialog */}
      <ReplanDialog
        open={replanOpen}
        onOpenChange={setReplanOpen}
        roadmap={roadmap}
        profile={profile}
        onRoadmapUpdate={onRoadmapUpdate}
      />
    </div>
  );
}

export function GraphWorkspace(props: GraphWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}

export function GraphLoadingState() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md px-6"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Building Your Career Roadmap
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          AI is analyzing your profile and generating a personalized skill-tree
          with connected milestones, projects, and learning paths.
        </p>
        <div className="space-y-2">
          <SkeletonLine width="100%" delay={0} />
          <SkeletonLine width="85%" delay={0.15} />
          <SkeletonLine width="70%" delay={0.3} />
        </div>
      </motion.div>
    </div>
  );
}

function SkeletonLine({ width, delay }: { width: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="h-3 bg-muted rounded mx-auto"
      style={{ width }}
    />
  );
}

export function GraphErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Could Not Generate Roadmap
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry}>
          <Loader2 className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}
