import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Acesso seguro à chave de API
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Configuração básica do modelo
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// 3. Função que o App.tsx está pedindo, com tratamento de erro
export const getDailyVerse = async () => {
  try {
    // Simplificamos a chamada para evitar o erro de 'responseMimeType'
    const result = await geminiModel.generateContent("Gere um versículo bíblico curto para marceneiros. Retorne apenas o texto do versículo e a referência.");
    
    const response = await result.response;
    const text = response.text();
    
    // Retornamos no formato que seu App.tsx provavelmente espera
    return { resposta: text };
  } catch (error) {
    console.error("Erro ao buscar versículo:", error);
    return { resposta: "Onde não há conselho os projetos fracassam, mas com muitos conselheiros há sucesso. (Provérbios 15:22)" };
  }
};