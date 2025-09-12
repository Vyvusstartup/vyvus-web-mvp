import { NextRequest, NextResponse } from 'next/server';
import { computeScore, type ScoreInput } from '@/lib/score';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScoreInput;
    // Basic validation: ensure required fields
    if (!body || !body.metrics) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const result = computeScore(body);
    return NextResponse.json(result, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
