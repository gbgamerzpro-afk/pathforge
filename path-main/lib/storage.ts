import { Roadmap, NodeStatus } from './types';

const STORAGE_KEY = 'pathforge:roadmap';
const PROFILE_KEY = 'pathforge:profile';

export function saveRoadmap(roadmap: Roadmap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmap));
  } catch {
    // Storage may be full or unavailable
  }
}

export function loadRoadmap(): Roadmap | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as Roadmap;
  } catch {
    return null;
  }
}

export function clearRoadmap(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveProfile(profile: unknown): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadProfile<T>(): T | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function updateNodeStatus(
  roadmap: Roadmap,
  nodeId: string,
  status: NodeStatus
): Roadmap {
  return {
    ...roadmap,
    nodes: roadmap.nodes.map((n) =>
      n.id === nodeId ? { ...n, status } : n
    ),
  };
}

export function computeProgress(roadmap: Roadmap) {
  const total = roadmap.nodes.length;
  const completed = roadmap.nodes.filter(
    (n) => n.status === 'completed' || n.status === 'already_known'
  ).length;
  const inProgress = roadmap.nodes.filter(
    (n) => n.status === 'in_progress'
  ).length;
  const remaining = roadmap.nodes.filter(
    (n) => n.status === 'available' || n.status === 'locked'
  ).length;
  const remainingHours = roadmap.nodes
    .filter((n) => n.status === 'available' || n.status === 'locked' || n.status === 'in_progress')
    .reduce((sum, n) => sum + n.estimatedHours, 0);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentPhase = roadmap.phases.find((p) =>
    roadmap.nodes.some(
      (n) => n.phaseId === p.id && (n.status === 'available' || n.status === 'in_progress')
    )
  );

  const nextNode = roadmap.nodes.find(
    (n) =>
      n.status === 'available' &&
      n.prerequisites.every(
        (prereq) => {
          const prereqNode = roadmap.nodes.find((pn) => pn.id === prereq);
          return prereqNode && (prereqNode.status === 'completed' || prereqNode.status === 'already_known');
        }
      )
  );

  return {
    total,
    completed,
    inProgress,
    remaining,
    remainingHours,
    percentage,
    currentPhase,
    nextNode,
  };
}
