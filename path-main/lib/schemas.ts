import { z } from 'zod';

const nodeTypeEnum = z.enum([
  'skill',
  'project',
  'credential',
  'role',
  'interview',
  'milestone',
]);

const nodeStatusEnum = z.enum([
  'available',
  'in_progress',
  'completed',
  'already_known',
  'locked',
]);

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

const resourceTypeEnum = z.enum([
  'documentation',
  'course',
  'video',
  'book',
  'repository',
  'article',
  'tool',
  'other',
]);

const relationshipTypeEnum = z.enum([
  'prerequisite',
  'builds_on',
  'leads_to',
  'unlocks',
]);

export const resourceSchema = z.object({
  title: z.string().min(1),
  type: resourceTypeEnum,
  url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  relevance: z.string().min(1),
});

export const phaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sequence: z.number().int().min(0),
});

export const roadmapNodeSchema = z.object({
  id: z.string().min(1),
  phaseId: z.string().min(1),
  title: z.string().min(1),
  type: nodeTypeEnum,
  description: z.string().min(1),
  whyItMatters: z.string().min(1),
  difficulty: difficultyEnum,
  estimatedHours: z.number().int().min(1),
  status: nodeStatusEnum.default('available'),
  prerequisites: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  resources: z.array(resourceSchema).default([]),
});

export const roadmapEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  relationshipType: relationshipTypeEnum,
});

export const roadmapSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  targetRole: z.string().min(1),
  targetCompanyType: z.string().min(1),
  personalizedSummary: z.string().min(1),
  estimatedDurationWeeks: z.number().int().min(1),
  assumptions: z.array(z.string()).default([]),
  phases: z.array(phaseSchema).min(1),
  nodes: z.array(roadmapNodeSchema).min(8).max(25),
  edges: z.array(roadmapEdgeSchema),
});

export const userProfileSchema = z.object({
  dreamJobTitle: z.string().min(2, 'Dream job title is required'),
  targetCompanyType: z.string().min(2, 'Target company type is required'),
  currentStage: z.string().min(2, 'Current stage is required'),
  existingSkills: z.array(z.string()).default([]),
  weeklyHours: z.number().int().min(1).max(80),
  timeframeWeeks: z.number().int().min(4).max(208),
  preferredLocation: z.string().min(1, 'Preferred location is required'),
  budgetPreference: z.string().optional(),
});

export const actionPlanSchema = z.object({
  projectIdea: z.string().min(1),
  implementationTasks: z.array(z.string()).min(1),
  learningPlan: z.array(z.string()).min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  commonMistakes: z.array(z.string()).min(1),
  interviewQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        guidance: z.string().min(1),
      })
    )
    .min(1),
  resources: z.array(resourceSchema).default([]),
});

export const replanRequestSchema = z.object({
  roadmap: roadmapSchema,
  userProfile: userProfileSchema,
  knownSkillIds: z.array(z.string()).default([]),
  completedNodeIds: z.array(z.string()).default([]),
  updatedWeeklyHours: z.number().int().min(1).max(80).optional(),
  updatedTimeframeWeeks: z.number().int().min(4).max(208).optional(),
});

export type RelationshipTypeEnum = z.infer<typeof relationshipTypeEnum>;
