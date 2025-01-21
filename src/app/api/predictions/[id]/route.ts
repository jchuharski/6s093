import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

interface PredictionResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

const replicate = new Replicate({
  auth: process.env.API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prediction = await replicate.predictions.get(params.id) as PredictionResponse;

    if (prediction?.error) {
      return NextResponse.json({ error: prediction.error }, { status: 500 });
    }

    return NextResponse.json(prediction);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 