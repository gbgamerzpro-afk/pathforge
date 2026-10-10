'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Target,
  ListChecks,
  BookOpen,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  AlertCircle,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoadmapNode, ActionPlan, UserProfile, Roadmap, NodeStatus } from '@/lib/types';

interface NodeDetailPanelProps {
  node: RoadmapNode | null;
  roadmap: Roadmap | null;
  profile: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (nodeId: string, status: NodeStatus) => void;
}

const STATUS_OPTIONS: { value: NodeStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'already_known', label: 'Already Know' },
];

const TYPE_LABELS: Record<string, string> = {
  skill: 'Skill',
  project: 'Project',
  credential: 'Credential',
  role: 'Role',
  interview: 'Interview Prep',
  milestone: 'Milestone',
};

export function NodeDetailPanel({
  node,
  roadmap,
  profile,
  open,
  onClose,
  onStatusChange,
}: NodeDetailPanelProps) {
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const handleGeneratePlan = useCallback(async () => {
    if (!node || !roadmap || !profile) return;
    setLoadingPlan(true);
    setPlanError(null);
    setActionPlan(null);
    try {
      const res = await fetch('/api/roadmap/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, roadmap, nodeId: node.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate action plan');
      }
      const plan = (await res.json()) as ActionPlan;
      setActionPlan(plan);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to generate action plan');
    } finally {
      setLoadingPlan(false);
    }
  }, [node, roadmap, profile]);

  const handleClose = () => {
    setActionPlan(null);
    setPlanError(null);
    onClose();
  };

  const prereqNodes = node?.prerequisites
    .map((id) => roadmap?.nodes.find((n) => n.id === id))
    .filter(Boolean) as RoadmapNode[] | [];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col bg-card border-border"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1">
              <Badge variant="secondary" className="mb-1.5">
                {TYPE_LABELS[node?.type ?? 'milestone']}
              </Badge>
              <SheetTitle className="text-xl font-bold leading-tight">
                {node?.title}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {node?.whyItMatters}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Description */}
            <Section icon={<Target className="h-4 w-4" />} title="Description">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {node?.description}
              </p>
            </Section>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label="Estimated"
                value={`${node?.estimatedHours ?? 0}h`}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Difficulty"
                value={node?.difficulty ?? '—'}
              />
              <StatCard
                icon={<ListChecks className="h-4 w-4" />}
                label="Prerequisites"
                value={String(node?.prerequisites.length ?? 0)}
              />
            </div>

            {/* Prerequisites */}
            {prereqNodes && prereqNodes.length > 0 && (
              <Section icon={<ListChecks className="h-4 w-4" />} title="Prerequisites">
                <div className="space-y-2">
                  {prereqNodes.map((prereq) => (
                    <div
                      key={prereq.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {prereq.status === 'completed' || prereq.status === 'already_known' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={prereq.status === 'completed' || prereq.status === 'already_known' ? 'text-muted-foreground line-through' : 'text-foreground'}>
                        {prereq.title}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Deliverables */}
            {node && node.deliverables.length > 0 && (
              <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Expected Deliverables">
                <ul className="space-y-1.5">
                  {node.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-accent mt-0.5">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Resources */}
            {node && node.resources.length > 0 && (
              <Section icon={<BookOpen className="h-4 w-4" />} title="Learning Resources">
                <div className="space-y-2">
                  {node.resources.map((resource, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <LinkIcon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{resource.title}</span>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:text-accent/80"
                              aria-label={`Open ${resource.title}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {resource.type} — {resource.relevance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Status controls */}
            <Section icon={<Circle className="h-4 w-4" />} title="Completion Status">
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={node?.status === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => node && onStatusChange(node.id, opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </Section>

            {/* Action Plan Section */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Action Plan
                </h3>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={loadingPlan || !node}
                  size="sm"
                >
                  {loadingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : actionPlan ? (
                    'Regenerate'
                  ) : (
                    'Generate Action Plan'
                  )}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {loadingPlan && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ActionPlanSkeleton />
                  </motion.div>
                )}

                {planError && !loadingPlan && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Failed to generate action plan</p>
                      <p className="text-xs text-destructive/80 mt-1">{planError}</p>
                    </div>
                  </motion.div>
                )}

                {actionPlan && !loadingPlan && (
                  <motion.div
                    key="plan"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <Section icon={<Target className="h-4 w-4" />} title="Project or Exercise">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {actionPlan.projectIdea}
                      </p>
                    </Section>

                    <Section icon={<ListChecks className="h-4 w-4" />} title="Implementation Tasks">
                      <ul className="space-y-1.5">
                        {actionPlan.implementationTasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-semibold mt-0.5">{i + 1}.</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section icon={<GraduationCap className="h-4 w-4" />} title="Learning Plan">
                      <ul className="space-y-1.5">
                        {actionPlan.learningPlan.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-accent mt-0.5">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Acceptance Criteria">
                      <ul className="space-y-1.5">
                        {actionPlan.acceptanceCriteria.map((criterion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section icon={<AlertCircle className="h-4 w-4" />} title="Common Mistakes to Avoid">
                      <ul className="space-y-1.5">
                        {actionPlan.commonMistakes.map((mistake, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-amber-500 mt-0.5">⚠</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Section icon={<MessageSquare className="h-4 w-4" />} title="Interview Questions">
                      <div className="space-y-3">
                        {actionPlan.interviewQuestions.map((q, i) => (
                          <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                            <p className="text-sm font-medium text-foreground mb-1">
                              {i + 1}. {q.question}
                            </p>
                            <p className="text-xs text-muted-foreground">{q.guidance}</p>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {actionPlan.resources.length > 0 && (
                      <Section icon={<BookOpen className="h-4 w-4" />} title="Recommended Resources">
                        <div className="space-y-2">
                          {actionPlan.resources.map((resource, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                              <LinkIcon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{resource.title}</span>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent hover:text-accent/80"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {resource.type} — {resource.relevance}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </motion.div>
                )}

                {!loadingPlan && !actionPlan && !planError && (
                  <div className="text-center py-8 rounded-lg border border-dashed border-border">
                    <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Generate a detailed action plan with project ideas, tasks, learning steps,
                      and interview questions tailored to this milestone.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
      <div className="flex items-center justify-center text-muted-foreground mb-1">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}

function ActionPlanSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      <div className="h-4 w-full bg-muted rounded animate-pulse" />
      <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
      <div className="space-y-2 mt-4">
        <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-90% bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-80% bg-muted/60 rounded animate-pulse" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-16 w-full bg-muted/40 rounded-lg animate-pulse" />
        <div className="h-16 w-full bg-muted/40 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
