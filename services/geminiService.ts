import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Correção do erro de Interface (VITE_GEMINI_API_KEY)
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// 2. Correção do erro 'getDailyVerse' (Exportando a função que o App.tsx procura)
export const getDailyVerse = async () => {
  try {
    // Usando a forma correta de configurar o JSON sem o SchemaType que deu erro
    const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: "Gere um versículo bíblico diário para marceneiros em formato JSON com o campo 'resposta'." }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    });
    
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Erro ao buscar versículo:", error);
    return { resposta: "Tudo o que fizerem, façam de todo o coração." };
  }
};