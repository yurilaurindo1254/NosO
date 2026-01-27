
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    // Model selection with multi-level fallback
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-2.0-flash-lite-preview-02-05"];
    
    // Check if user provided specific context (optional)
    let context = "";
    try {
        const body = await req.json();
        context = body.context || "";
    } catch (e) {
        // Ignore JSON parse error if body is empty
    }

    const systemInstruction = `
      Você é um assistente pessoal divertido e proativo para casais que moram juntos.
      Seu objetivo é sugerir 5 a 8 tarefas variadas que podem ser feitas em casa.
      
      REGRAS:
      1. Siga o contexto se fornecido (ex: "Limpeza", "Jantar Romântico", "Organização").
      2. Se não houver contexto, gere uma mistura de tarefas domésticas (louça, lixo) e coisas legais de casal (massagem, ver filme, planejar viagem).
      3. A saída deve ser ESTRITAMENTE um JSON Array.
      4. Formato de cada item:
         {
           "title": "Nome da tarefa (curto e direto)",
           "category": "Categoria sugerida (ex: Cozinha, Sala, Date, Finanças)"
         }
      5. Use emojis nos títulos ou categorias se for apropriado e fofo.
    `;

    const userPrompt = context ? `Contexto solicitado: ${context}` : "Gere sugestões aleatórias e úteis para hoje.";
    const fullPrompt = systemInstruction + "\n\n" + userPrompt;

    let text = "";
    let success = false;
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting Task Gen with ${modelName}...`);
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
        console.error("All AI models failed:", lastError);
        return NextResponse.json({ error: "A IA está tirando um cochilo (503). Tente depois!" }, { status: 503 });
    }

    // Clean up potential markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const tasks = JSON.parse(text);
        if (!Array.isArray(tasks)) throw new Error("Response is not an array");
        return NextResponse.json({ tasks });
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw Text:", text);
        return NextResponse.json({ error: "A IA se confundiu na resposta." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("AI Tasks Fatal Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor.", details: error.message },
      { status: 500 }
    );
  }
}
