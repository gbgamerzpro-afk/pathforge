'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, Clock, CalendarDays, AlertCircle } from 'lucide-react';
import { Roadmap, UserProfile, NodeStatus } from '@/lib/types';
import { computeProgress } from '@/lib/storage';

interface ReplanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmap: Roadmap;
  profile: UserProfile;
  onRoadmapUpdate: (roadmap: Roadmap) => void;
}

export function ReplanDialog({
  open,
  onOpenChange,
  roadmap,
  profile,
  onRoadmapUpdate,
}: ReplanDialogProps) {
  const [weeklyHours, setWeeklyHours] = useState(String(profile.weeklyHours));
  const [timeframeWeeks, setTimeframeWeeks] = useState(String(profile.timeframeWeeks));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = computeProgress(roadmap);
  const knownSkills = roadmap.nodes.filter((n) => n.status === 'already_known');
  const completedNodes = roadmap.nodes.filter((n) => n.status === 'completed');

  const handleReplan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roadmap/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmap,
          userProfile: {
            ...profile,
            weeklyHours: parseInt(weeklyHours, 10),
            timeframeWeeks: parseInt(timeframeWeeks, 10),
          },
          knownSkillIds: knownSkills.map((n) => n.id),
          completedNodeIds: completedNodes.map((n) => n.id),
          updatedWeeklyHours: parseInt(weeklyHours, 10),
          updatedTimeframeWeeks: parseInt(timeframeWeeks, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to replan roadmap');
      }

      const revisedRoadmap = (await res.json()) as Roadmap;

      const preservedNodes = revisedRoadmap.nodes.map((node) => {
        const originalNode = roadmap.nodes.find((n) => n.id === node.id);
        if (originalNode?.status === 'completed') {
          return { ...node, status: 'completed' as NodeStatus };
        }
        if (originalNode?.status === 'already_known') {
          return { ...node, status: 'already_known' as NodeStatus };
        }
        if (originalNode?.status === 'in_progress') {
          return { ...node, status: 'in_progress' as NodeStatus };
        }
        return node;
      });

      onRoadmapUpdate({ ...revisedRoadmap, nodes: preservedNodes });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replan roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Adjust Your Plan
          </DialogTitle>
          <DialogDescription>
            Update your weekly hours or timeframe. The AI will replan the remaining
            roadmap based on your current progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current progress summary */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completed milestones</span>
              <span className="font-medium text-foreground">{progress.completed}/{progress.total}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Known skills</span>
              <span className="font-medium text-foreground">{knownSkills.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Remaining hours</span>
              <span className="font-medium text-foreground">{progress.remainingHours}h</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Weekly Hours Available
            </Label>
            <Input
              type="number"
              min={1}
              max={80}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              aria-label="Weekly hours available"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Target Timeframe (weeks)
            </Label>
            <Input
              type="number"
              min={4}
              max={208}
              value={timeframeWeeks}
              onChange={(e) => setTimeframeWeeks(e.target.value)}
              aria-label="Target timeframe in weeks"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Skills marked as "Already Know" and completed milestones will be preserved.
            The AI will remove redundant learning and recalculate remaining time.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReplan} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Replanning...
              </>
            ) : (
              'Replan Roadmap'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
