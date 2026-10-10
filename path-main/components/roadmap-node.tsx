'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  BookOpen,
  FolderGit2,
  Award,
  Briefcase,
  MessageSquare,
  Flag,
  Check,
  Lock,
  Loader,
  Sparkles,
} from 'lucide-react';
import { RoadmapNode, NodeType, NodeStatus, Difficulty } from '@/lib/types';

export interface RoadmapNodeData extends RoadmapNode {
  phaseColor: string;
  phaseTitle: string;
  [key: string]: unknown;
}

const NODE_CONFIG: Record<
  NodeType,
  { icon: typeof BookOpen; label: string; color: string }
> = {
  skill: { icon: BookOpen, label: 'Skill', color: 'var(--color-skill)' },
  project: { icon: FolderGit2, label: 'Project', color: 'var(--color-project)' },
  credential: { icon: Award, label: 'Credential', color: 'var(--color-credential)' },
  role: { icon: Briefcase, label: 'Role', color: 'var(--color-role)' },
  interview: { icon: MessageSquare, label: 'Interview', color: 'var(--color-interview)' },
  milestone: { icon: Flag, label: 'Milestone', color: 'var(--color-milestone)' },
};

const STATUS_STYLES: Record<NodeStatus, { border: string; opacity: string; badge: string }> = {
  available: { border: '', opacity: 'opacity-100', badge: '' },
  in_progress: { border: 'ring-2 ring-accent', opacity: 'opacity-100', badge: 'in-progress' },
  completed: { border: 'border-success/60', opacity: 'opacity-75', badge: 'completed' },
  already_known: { border: 'border-success/40', opacity: 'opacity-60', badge: 'known' },
  locked: { border: '', opacity: 'opacity-40', badge: 'locked' },
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-400',
  intermediate: 'bg-amber-500/15 text-amber-400',
  advanced: 'bg-rose-500/15 text-rose-400',
};

function StatusBadge({ status }: { status: NodeStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
        <Check className="h-2.5 w-2.5" /> Done
      </span>
    );
  }
  if (status === 'already_known') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400">
        <Sparkles className="h-2.5 w-2.5" /> Known
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-400">
        <Loader className="h-2.5 w-2.5" /> Active
      </span>
    );
  }
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
        <Lock className="h-2.5 w-2.5" /> Locked
      </span>
    );
  }
  return null;
}

function RoadmapNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as RoadmapNodeData;
  const config = NODE_CONFIG[nodeData.type];
  const Icon = config.icon;
  const statusStyle = STATUS_STYLES[nodeData.status];

  return (
    <div
      className={`relative w-[220px] rounded-xl border bg-card/90 backdrop-blur-sm p-3.5 shadow-lg transition-all cursor-pointer hover:shadow-xl hover:border-primary/50 ${statusStyle.border} ${statusStyle.opacity} ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-background"
        style={{ background: nodeData.phaseColor }}
      />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {config.label}
          </span>
        </div>
        <StatusBadge status={nodeData.status} />
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
        {nodeData.title}
      </h3>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
        {nodeData.description}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_STYLES[nodeData.difficulty]}`}
        >
          {nodeData.difficulty}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {nodeData.estimatedHours}h
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-background"
        style={{ background: nodeData.phaseColor }}
      />
    </div>
  );
}

export const RoadmapNodeView = memo(RoadmapNodeComponent);
