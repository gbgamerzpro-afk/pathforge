import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateActionPlan, AIConfigError, AIResponseError } from '@/lib/ai';
import { userProfileSchema, roadmapSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BODY_SIZE = 1024 * 32;

const actionPlanRequestSchema = z.object({
  profile: userProfileSchema,
  roadmap: roadmapSchema,
  nodeId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    if (body.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const result = actionPlanRequestSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          detail: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
        { status: 400 }
      );
    }

    const { profile, roadmap, nodeId } = result.data;
    const actionPlan = await generateActionPlan(profile, roadmap, nodeId);
    return NextResponse.json(actionPlan);
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AIResponseError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
