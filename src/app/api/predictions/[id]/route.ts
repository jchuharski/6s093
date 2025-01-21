import { NextRequest } from "next/server";
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
  req: NextRequest,
) {
  try {
    // Get ID from URL instead of params
    const id = req.url.split('/').pop();
    if (!id) {
      return Response.json({ error: 'No ID provided' }, { status: 400 });
    }

    const prediction = await replicate.predictions.get(id);
    return Response.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return Response.json(
      { error: 'Failed to fetch prediction' }, 
      { status: 500 }
    );
  }
} 