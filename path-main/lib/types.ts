export type NodeType =
  | 'skill'
  | 'project'
  | 'credential'
  | 'role'
  | 'interview'
  | 'milestone';

export type NodeStatus =
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'already_known'
  | 'locked';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ResourceType =
  | 'documentation'
  | 'course'
  | 'video'
  | 'book'
  | 'repository'
  | 'article'
  | 'tool'
  | 'other';

export type RelationshipType =
  | 'prerequisite'
  | 'builds_on'
  | 'leads_to'
  | 'unlocks';

export interface Resource {
  title: string;
  type: ResourceType;
  url?: string;
  relevance: string;
}

export interface RoadmapNode {
  id: string;
  phaseId: string;
  title: string;
  type: NodeType;
  description: string;
  whyItMatters: string;
  difficulty: Difficulty;
  estimatedHours: number;
  status: NodeStatus;
  prerequisites: string[];
  deliverables: string[];
  resources: Resource[];
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  sequence: number;
}

export interface Roadmap {
  id: string;
  title: string;
  targetRole: string;
  targetCompanyType: string;
  personalizedSummary: string;
  estimatedDurationWeeks: number;
  assumptions: string[];
  phases: Phase[];
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export interface UserProfile {
  dreamJobTitle: string;
  targetCompanyType: string;
  currentStage: string;
  existingSkills: string[];
  weeklyHours: number;
  timeframeWeeks: number;
  preferredLocation: string;
  budgetPreference?: string;
}

export interface ActionPlan {
  projectIdea: string;
  implementationTasks: string[];
  learningPlan: string[];
  acceptanceCriteria: string[];
  commonMistakes: string[];
  interviewQuestions: { question: string; guidance: string }[];
  resources: Resource[];
}

export interface ReplanRequest {
  roadmap: Roadmap;
  userProfile: UserProfile;
  knownSkillIds: string[];
  completedNodeIds: string[];
  updatedWeeklyHours?: number;
  updatedTimeframeWeeks?: number;
}

export interface ApiError {
  error: string;
  detail?: string;
}
