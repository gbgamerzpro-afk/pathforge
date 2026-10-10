import { Roadmap, RoadmapNode } from './types';

interface PositionedNode {
  id: string;
  position: { x: number; y: number };
  data: RoadmapNode & { phaseColor: string; phaseTitle: string };
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 60;

const PHASE_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

export function getPhaseColor(sequence: number): string {
  return PHASE_COLORS[sequence % PHASE_COLORS.length];
}

export function layoutRoadmap(roadmap: Roadmap): {
  nodes: PositionedNode[];
} {
  const sortedPhases = [...roadmap.phases].sort((a, b) => a.sequence - b.sequence);

  const nodesByPhase = new Map<string, RoadmapNode[]>();
  for (const phase of sortedPhases) {
    nodesByPhase.set(
      phase.id,
      roadmap.nodes
        .filter((n) => n.phaseId === phase.id)
        .sort((a, b) => {
          const aHasPrereqs = a.prerequisites.length;
          const bHasPrereqs = b.prerequisites.length;
          if (aHasPrereqs === 0 && bHasPrereqs > 0) return -1;
          if (bHasPrereqs === 0 && aHasPrereqs > 0) return 1;
          return 0;
        })
    );
  }

  const positions = new Map<string, { x: number; y: number }>();
  let currentX = 0;

  for (const phase of sortedPhases) {
    const phaseNodes = nodesByPhase.get(phase.id) ?? [];
    const columnCount = Math.min(phaseNodes.length, 3);
    const rowsPerColumn = Math.ceil(phaseNodes.length / columnCount);

    const phaseWidth = columnCount * (NODE_WIDTH + HORIZONTAL_GAP);
    const phaseHeight = rowsPerColumn * (NODE_HEIGHT + VERTICAL_GAP);

    phaseNodes.forEach((node, index) => {
      const col = index % columnCount;
      const row = Math.floor(index / columnCount);

      positions.set(node.id, {
        x: currentX + col * (NODE_WIDTH + HORIZONTAL_GAP),
        y: row * (NODE_HEIGHT + VERTICAL_GAP),
      });
    });

    currentX += phaseWidth + HORIZONTAL_GAP * 2;
    void phaseHeight;
  }

  const positionedNodes = roadmap.nodes.map((node) => {
    const pos = positions.get(node.id) ?? { x: 0, y: 0 };
    const phase = roadmap.phases.find((p) => p.id === node.phaseId);
    return {
      id: node.id,
      position: pos,
      data: {
        ...node,
        phaseColor: getPhaseColor(phase?.sequence ?? 0),
        phaseTitle: phase?.title ?? '',
      },
    };
  });

  return { nodes: positionedNodes };
}
