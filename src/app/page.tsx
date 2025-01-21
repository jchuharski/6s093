'use client'
import { useState } from "react";
import Image from "next/image";

interface ComicPanel {
  imageUrl: string;
  caption: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panels, setPanels] = useState<any[]>([]);

  const pollPrediction = async (id: string) => {
    const response = await fetch(`/api/predictions/${id}`);
    const prediction = await response.json();
    return prediction;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPanels([]);

    try {
      // Create predictions
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Poll each prediction until complete
      const completedPanels = await Promise.all(
        data.predictions.map(async (pred: any) => {
          let prediction;
          do {
            prediction = await pollPrediction(pred.id);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between polls
          } while (prediction.status !== 'succeeded' && prediction.status !== 'failed');

          if (prediction.status === 'failed') {
            throw new Error(`Panel generation failed: ${prediction.error}`);
          }

          return {
            imageUrl: prediction.output[0],
            caption: pred.caption
          };
        })
      );

      setPanels(completedPanels);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Sleek header */}
        <header className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            The Cat Chronicles
          </h1>
          <p className="text-gray-400 text-xl font-light tracking-wider">
            WHERE FELINE TALES COME TO LIFE
          </p>
        </header>

        {/* Noir-style form */}
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-purple-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-purple-400 mb-3 font-medium tracking-wide uppercase text-sm">
                Create Your Feline Fantasy
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="In the shadows of the night, Ivy prowls..."
                rows={4}
                className="w-full p-4 bg-gray-900 border border-purple-500/30 rounded-xl 
                          focus:ring-2 focus:ring-purple-500 focus:border-transparent
                          text-gray-100 placeholder-gray-500"
              />
            </div>
            <button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                         hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl
                         transition-all transform hover:scale-[1.02] disabled:opacity-50
                         disabled:cursor-not-allowed disabled:hover:scale-100
                         shadow-lg shadow-purple-500/20"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Crafting Your Tale..." : "Generate Comic 🐱‍👤"}
            </button>
          </form>
        </div>

        {error && (
          <div className="w-full p-4 bg-red-900/20 text-red-400 rounded-xl border border-red-800">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="w-full text-center">
            <div className="inline-block px-6 py-3 bg-gray-800 rounded-xl text-purple-400">
              <span className="animate-pulse">Summoning your comic from the shadows...</span>
            </div>
          </div>
        )}

        {panels.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
            {panels.map((panel, index) => (
              <div key={index} className="flex flex-col items-center gap-4 group">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden 
                              shadow-2xl shadow-purple-500/20 transform transition-transform 
                              duration-300 group-hover:scale-[1.02]">
                  <Image
                    src={panel.imageUrl}
                    alt={`Comic panel ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                    priority={index < 3}
                  />
                </div>
                <p className="text-center text-gray-400 italic px-4 font-light">
                  {panel.caption}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
