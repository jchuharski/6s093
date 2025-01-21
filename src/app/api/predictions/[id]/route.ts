import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id;
    const prediction = await replicate.predictions.get(id);

    if (prediction?.error) {
      return NextResponse.json({ error: prediction.error }, { status: 500 });
    }

    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 