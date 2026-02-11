import { GoogleGenAI, Type } from "@google/genai";
import { FinancialPrediction, BibleVerse } from "../types";

// Inicializa a IA com a chave de API do ambiente (Padrão estrito)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialPrediction = async (
  currentRevenue: number,
  pendingRevenue: number,
  expenses: number,
  activeProjectsCount: number
): Promise<FinancialPrediction | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key do Google Gemini não encontrada.");
    return null;
  }

  const prompt = `
    Analise o cenário financeiro desta marcenaria.
    Dados atuais:
    - Faturamento Realizado: R$ ${currentRevenue}
    - Faturamento Pendente: R$ ${pendingRevenue}
    - Despesas: R$ ${expenses}
    - Projetos Ativos: ${activeProjectsCount}
    
    Calcule uma previsão realista.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedRevenue: { type: Type.NUMBER },
            estimatedProfit: { type: Type.NUMBER },
            riskAlerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as FinancialPrediction;
  } catch (error) {
    console.error("Financial prediction failed:", error);
    return null;
  }
};

export const getDailyVerse = async (): Promise<BibleVerse | null> => {
  if (!process.env.API_KEY) return null;

  const prompt = `Selecione um versículo bíblico motivador sobre trabalho, sabedoria ou construção.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            reference: { type: Type.STRING },
            meaning: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as BibleVerse;
  } catch (error) {
    console.error("Daily verse failed:", error);
    return null;
  }
};