
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    // Model selection with multi-level fallback
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-2.0-flash-lite-preview-02-05"];

    const systemInstruction = `
      Você é um assistente pessoal inteligente para um casal. 
      Seu objetivo é ajudar a planejar encontros, jantares, viagens e dar conselhos de relacionamento.
      Responda sempre com formatação Markdown bonita (negrito, listas, tópicos).
      Seja romântico, prático e divertido.
      Contexto atual: ${context || "Geral"}
    `;

    const fullPrompt = `${systemInstruction}\n\nUsuário: ${message}`;

    for (const modelName of models) {
        try {
            console.log(`Attempting Planner with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return NextResponse.json({ result: response.text() });
        } catch (err: any) {
            console.warn(`${modelName} failed: ${err.message}`);
        }
    }
    
    // If we get here, all models failed
    return NextResponse.json({ 
       error: `O cérebro da IA está sobrecarregado (503). Tente novamente em alguns instantes.` 
    }, { status: 503 });

  } catch (error: any) {
    console.error("Gemini API Fatal Error:", error);
    return NextResponse.json({ error: `Erro interno: ${error.message}` }, { status: 500 });
  }
}
