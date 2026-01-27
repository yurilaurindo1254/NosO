
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { ingredients, style } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    // Model selection with multi-level fallback
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-2.0-flash-lite-preview-02-05"];
    
    const systemInstruction = `
      Você é um chef de cozinha experiente, criativo e prático.
      Seu objetivo é criar UMA receita incrível baseada nos ingredientes ou desejos informados.
      
      REGRAS CRÍTICAS:
      1. Sua saída DEVE ser estritamente um JSON válido. NADA de texto antes ou depois.
      2. O JSON deve ter exatamente esta estrutura:
         {
           "title": "Nome criativo do prato",
           "ingredients": "Lista formatada com quebras de linha (\\n)",
           "instructions": "Passo a passo numerado e claro, com quebras de linha (\\n)",
           "tags": ["Tag1", "Tag2"] (Ex: "Rápido", "Fit", "Romântico", "Fácil")
         }
      3. Seja divertido e use emojis no título.
      4. Se o usuário pedir algo impossível ou perigoso, retorne um título "O Chef derrubou a panela" e explique gentilmente nas instruções.
    `;

    const userPrompt = `Ingredientes/Desejo: ${ingredients} ${style ? `\nEstilo/Restrição: ${style}` : ''}`;
    const fullPrompt = systemInstruction + "\n\n" + userPrompt;

    let text = "";
    let success = false;
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting Recipe with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] });
            text = await result.response.text();
            success = true;
            break; // Success!
        } catch (err: any) {
            console.warn(`${modelName} failed: ${err.message}`);
            lastError = err;
        }
    }

    if (!success) {
        console.error("All Chef models failed:", lastError);
        return NextResponse.json({ error: "Os chefs estão em greve (503). Tente mais tarde!" }, { status: 503 });
    }

    console.log("AI Chef Raw Response:", text);

    // Clean up potential markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const recipe = JSON.parse(text);
        return NextResponse.json(recipe);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        return NextResponse.json({ error: "O Chef escreveu com letra feia (Erro de JSON)." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("AI Chef Fatal Error:", error);
    return NextResponse.json(
      { error: "O Chef derrubou a panela! Tente novamente.", details: error.message },
      { status: 500 }
    );
  }
}
