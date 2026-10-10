import { Roadmap, UserProfile, ActionPlan, ReplanRequest } from './types';
import {
  roadmapSchema,
  actionPlanSchema,
  userProfileSchema,
} from './schemas';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getApiKey(): string {
  if (!GEMINI_API_KEY) {
    throw new AIConfigError(
      'GEMINI_API_KEY is not configured. Set it in your .env file.'
    );
  }
  return GEMINI_API_KEY;
}

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIConfigError';
  }
}

export class AIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIResponseError';
  }
}

function geminiEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;
}

function buildSystemPrompt(): string {
  return `You are PathForge, an expert career strategist and technical mentor. You create personalized, realistic career roadmaps as structured JSON.

Rules:
1. Respond with ONLY valid JSON. No markdown, no code fences, no commentary.
2. Be specific to the user's target role, company type, experience, skills, location, available time, and budget.
3. Create 12-18 nodes across 3-6 phases. Adjust based on the user's starting point.
4. Every node id must be unique (e.g., "n1", "n2"). Phase ids must be unique (e.g., "p1", "p2").
5. Each node's phaseId must reference a valid phase id.
6. Prerequisites reference other node ids. Never create circular dependencies.
7. Edges must reference existing node ids. source = prerequisite, target = dependent.
8. Include real, recognizable resources with working URLs only when you are confident. Never invent URLs.
9. Do not add irrelevant technologies or generic advice. Focus on what the specific target role requires.
10. Mark existing skills the user already has as "already_known" status where applicable.
11. Estimate hours realistically. Adjust based on the user's weekly availability and timeframe.
12. Ensure the roadmap is achievable within the user's timeframe given their weekly hours.`;
}

function buildRoadmapPrompt(profile: UserProfile): string {
  return `Create a career roadmap for this person:

Dream Job: ${profile.dreamJobTitle}
Target Company Type: ${profile.targetCompanyType}
Current Stage: ${profile.currentStage}
Existing Skills: ${profile.existingSkills.join(', ') || 'None'}
Weekly Hours Available: ${profile.weeklyHours}
Target Timeframe: ${profile.timeframeWeeks} weeks
Preferred Location: ${profile.preferredLocation}
Budget Preference: ${profile.budgetPreference || 'No specific preference'}

Return JSON with this exact structure:
{
  "id": "roadmap-<short-uuid>",
  "title": "<descriptive title>",
  "targetRole": "<the target role>",
  "targetCompanyType": "<company type>",
  "personalizedSummary": "<2-3 sentence personalized summary>",
  "estimatedDurationWeeks": <number>,
  "assumptions": ["<assumption 1>", ...],
  "phases": [
    { "id": "p1", "title": "...", "description": "...", "sequence": 0 }
  ],
  "nodes": [
    {
      "id": "n1",
      "phaseId": "p1",
      "title": "...",
      "type": "skill|project|credential|role|interview|milestone",
      "description": "...",
      "whyItMatters": "...",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedHours": <number>,
      "status": "available|already_known",
      "prerequisites": ["n0"],
      "deliverables": ["..."],
      "resources": [
        { "title": "...", "type": "documentation|course|video|book|repository|article|tool|other", "url": "https://...", "relevance": "..." }
      ]
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "relationshipType": "prerequisite|builds_on|leads_to|unlocks" }
  ]
}`;
}

function buildActionPlanPrompt(
  profile: UserProfile,
  roadmap: Roadmap,
  node: { id: string; title: string; description: string; type: string; prerequisites: string[] }
): string {
  const prereqNodes = node.prerequisites
    .map((id) => roadmap.nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => `${n!.title}: ${n!.description}`)
    .join('\n');

  return `Generate a detailed action plan for this career milestone.

User Profile:
- Target Role: ${profile.dreamJobTitle} at ${profile.targetCompanyType}
- Current Stage: ${profile.currentStage}
- Existing Skills: ${profile.existingSkills.join(', ') || 'None'}
- Weekly Hours: ${profile.weeklyHours}
- Location: ${profile.preferredLocation}

Milestone: ${node.title}
Description: ${node.description}
Type: ${node.type}

Prerequisites completed:
${prereqNodes || 'None - this is a starting milestone'}

Return JSON with this exact structure:
{
  "projectIdea": "<specific project or exercise description>",
  "implementationTasks": ["<task 1>", "<task 2>", ...],
  "learningPlan": ["<learning step 1>", ...],
  "acceptanceCriteria": ["<criterion 1>", ...],
  "commonMistakes": ["<mistake 1>", ...],
  "interviewQuestions": [
    { "question": "...", "guidance": "..." }
  ],
  "resources": [
    { "title": "...", "type": "documentation|course|video|book|repository|article|tool|other", "url": "https://...", "relevance": "..." }
  ]
}

Be specific to the milestone and target role. Do not provide generic advice.`;
}

function buildReplanPrompt(request: ReplanRequest): string {
  const knownNodes = request.knownSkillIds
    .map((id) => request.roadmap.nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => n!.title);

  const completedNodes = request.completedNodeIds
    .map((id) => request.roadmap.nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => n!.title);

  const weeklyHours = request.updatedWeeklyHours ?? request.userProfile.weeklyHours;
  const timeframe = request.updatedTimeframeWeeks ?? request.userProfile.timeframeWeeks;

  return `Revise this career roadmap based on updated information.

User Profile:
- Target Role: ${request.userProfile.dreamJobTitle} at ${request.userProfile.targetCompanyType}
- Current Stage: ${request.userProfile.currentStage}
- Weekly Hours: ${weeklyHours} (updated)
- Timeframe: ${timeframe} weeks (updated)
- Location: ${request.userProfile.preferredLocation}

Newly Known Skills (mark as "already_known" and keep in graph but skip): ${knownNodes.join(', ') || 'None'}

Completed Milestones (preserve as "completed"): ${completedNodes.join(', ') || 'None'}

Current roadmap structure:
- Phases: ${request.roadmap.phases.map((p) => `${p.id}:${p.title}`).join(', ')}
- Nodes: ${request.roadmap.nodes.map((n) => `${n.id}:${n.title}(${n.status})`).join(', ')}
- Edges: ${request.roadmap.edges.map((e) => `${e.source}->${e.target}`).join(', ')}

Instructions:
1. Remove redundant learning nodes for skills the user already knows. Replace them with appropriate next steps.
2. Preserve completed nodes with status "completed".
3. Recalculate estimated hours and duration based on new weekly hours (${weeklyHours}) and timeframe (${timeframe} weeks).
4. Maintain valid dependency edges. No cycles.
5. Keep the same roadmap id.
6. Return the COMPLETE revised roadmap with the same JSON structure as the original.

Return ONLY the revised roadmap JSON.`;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2
): Promise<string> {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(geminiEndpoint(GEMINI_MODEL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 429 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new AIResponseError(
          `Gemini API returned ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason;
        if (blockReason) {
          throw new AIResponseError(`Request blocked: ${blockReason}`);
        }
        throw new AIResponseError('Gemini returned an empty response');
      }

      return text;
    } catch (err) {
      lastError = err as Error;
      if (err instanceof AIResponseError && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new AIResponseError('Request timed out after 60 seconds');
        if (attempt < maxRetries) continue;
      }
      throw err;
    }
  }

  throw lastError ?? new AIResponseError('Unknown error');
}

function extractJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

export async function generateRoadmap(
  profile: UserProfile
): Promise<Roadmap> {
  const validatedProfile = userProfileSchema.parse(profile);
  const text = await callGemini(
    buildSystemPrompt(),
    buildRoadmapPrompt(validatedProfile)
  );

  const jsonStr = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AIResponseError('AI returned malformed JSON that could not be parsed');
  }

  const result = roadmapSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIResponseError(
      `AI response failed validation: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }

  return validateRoadmapStructure(result.data as Roadmap);
}

export async function generateActionPlan(
  profile: UserProfile,
  roadmap: Roadmap,
  nodeId: string
): Promise<ActionPlan> {
  const node = roadmap.nodes.find((n) => n.id === nodeId);
  if (!node) {
    throw new AIResponseError('Node not found in roadmap');
  }

  const text = await callGemini(
    buildSystemPrompt(),
    buildActionPlanPrompt(profile, roadmap, {
      id: node.id,
      title: node.title,
      description: node.description,
      type: node.type,
      prerequisites: node.prerequisites,
    })
  );

  const jsonStr = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AIResponseError('AI returned malformed JSON for action plan');
  }

  const result = actionPlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIResponseError(
      `Action plan failed validation: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }

  return result.data as ActionPlan;
}

export async function replanRoadmap(
  request: ReplanRequest
): Promise<Roadmap> {
  const text = await callGemini(
    buildSystemPrompt(),
    buildReplanPrompt(request)
  );

  const jsonStr = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AIResponseError('AI returned malformed JSON for replan');
  }

  const result = roadmapSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIResponseError(
      `Revised roadmap failed validation: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }

  return validateRoadmapStructure(result.data as Roadmap);
}

function validateRoadmapStructure(roadmap: Roadmap): Roadmap {
  const nodeIds = new Set(roadmap.nodes.map((n) => n.id));
  const phaseIds = new Set(roadmap.phases.map((p) => p.id));

  for (const node of roadmap.nodes) {
    if (!phaseIds.has(node.phaseId)) {
      throw new AIResponseError(`Node ${node.id} references unknown phase ${node.phaseId}`);
    }
    for (const prereq of node.prerequisites) {
      if (!nodeIds.has(prereq)) {
        throw new AIResponseError(`Node ${node.id} has unknown prerequisite ${prereq}`);
      }
    }
  }

  for (const edge of roadmap.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new AIResponseError(`Edge ${edge.id} references unknown node`);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const deps = roadmap.edges.filter((e) => e.source === nodeId);
    for (const dep of deps) {
      if (!visited.has(dep.target)) {
        if (hasCycle(dep.target)) return true;
      } else if (recStack.has(dep.target)) {
        return true;
      }
    }
    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) {
        throw new AIResponseError('Roadmap contains circular dependencies');
      }
    }
  }

  return roadmap;
}
