import { NextRequest, NextResponse } from 'next/server';
import { userProfileSchema } from '@/lib/schemas';
import { generateRoadmap, AIConfigError, AIResponseError } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BODY_SIZE = 1024 * 4;

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

    const result = userProfileSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid user profile',
          detail: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
        { status: 400 }
      );
    }

    const roadmap = await generateRoadmap(result.data);
    return NextResponse.json(roadmap);
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
