import { NextResponse } from "next/server";
import Replicate from "replicate";
import OpenAI from 'openai';

// Constants
// const REPLICATE_USERNAME = "sundai-club";
// const FINETUNED_MODEL_NAME = "ivy-cat-workshop-1";
const MODEL_VERSION = "74382aeb7b42d67052fe93f7e4339ed79db43baa1ced8b9ac20025b02896a066";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.API_KEY,
});

// Initialize Azure OpenAI client with correct configuration
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
  defaultQuery: { "api-version": "2024-02-15-preview" }
});

// Add these interfaces at the top of the file
interface StoryPanel {
  prompt: string;
  caption: string;
}

// interface StoryResponse {
//   comics: StoryPanel[];
// }

interface ReplicatePrediction {
  id: string;
  status: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    // Validate API keys first
    if (!process.env.GITHUB_TOKEN) {
      console.error('Azure OpenAI API key (GITHUB_TOKEN) is missing');
      return NextResponse.json(
        { error: 'Azure OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.API_KEY) {
      console.error('Replicate API key (API_KEY) is missing');
      return NextResponse.json(
        { error: 'Replicate API key is not configured' },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();
    console.log('\n=== Starting New Comic Generation ===');
    console.log('📝 Received prompt:', prompt);
    console.log('🔑 Using Azure OpenAI key:', !!process.env.GITHUB_TOKEN);

    // Generate story with Azure OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Create a 3-panel comic story about a cat's adventure. For each panel, provide:
1. An image generation prompt that includes 'IVYTHECAT fluffy gray cat' and ends with 'cartoonish style, warm colors'
2. A caption that refers to the dog as 'Ivy'

Format the output as JSON with this structure:
{
    "comics": [
        {
            "prompt": "Image generation prompt here",
            "caption": "Caption text here"
        }
    ]
}`
        },
        { role: "user", content: prompt }
      ]
    });

    const storyJson = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Story generated:', storyJson);

    // Create predictions for each panel
    const predictions = await Promise.all(
      storyJson.comics.map(async (panel: StoryPanel, index: number) => {
        console.log(`\n🖼️ Creating prediction for panel ${index + 1}`);
        
        const prediction = await replicate.predictions.create({
          version: MODEL_VERSION,
          input: {
            prompt: panel.prompt,
            num_inference_steps: 4,
            guidance_scale: 10,
            model: "schnell"
          }
        }) as ReplicatePrediction;

        console.log(`✅ Prediction created for panel ${index + 1}:`, prediction.id);
        
        return {
          id: prediction.id,
          caption: panel.caption
        };
      })
    );

    return NextResponse.json({ predictions }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
} 