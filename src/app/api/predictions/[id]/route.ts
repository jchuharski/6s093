// import { NextResponse } from "next/server";
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

interface Context {
  params: {
    id: string;
  };
}

export async function GET(
  _req: Request,
  context: Context
): Promise<Response> {
  try {
    const prediction = await replicate.predictions.get(context.params.id) as PredictionResponse;

    if (prediction?.error) {
      return Response.json({ error: prediction.error }, { status: 500 });
    }

    return Response.json(prediction);
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 