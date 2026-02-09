
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialPrediction, BibleVerse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialPrediction = async (
  currentRevenue: number,
  pendingRevenue: number,
  expenses: number,
  activeProjectsCount: number
): Promise<FinancialPrediction | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o cenário financeiro desta marcenaria:
      - Faturamento Realizado: R$ ${currentRevenue}
      - Faturamento Pendente (Sinais/A receber): R$ ${pendingRevenue}
      - Total de Despesas (Fixas + Materiais): R$ ${expenses}
      - Projetos Ativos em Produção: ${activeProjectsCount}
      
      Forneça uma previsão para o próximo mês, identifique riscos e sugira melhorias.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedRevenue: { type: Type.NUMBER },
            estimatedProfit: { type: Type.NUMBER },
            riskAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["estimatedRevenue", "estimatedProfit", "riskAlerts", "suggestions"]
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text.trim()) as FinancialPrediction;
  } catch (error) {
    console.error("Financial prediction failed:", error);
    return null;
  }
};

export const getDailyVerse = async (): Promise<BibleVerse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Selecione um versículo bíblico motivador que se relacione com trabalho duro, excelência ou carpintaria.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            reference: { type: Type.STRING },
            meaning: { type: Type.STRING },
          },
          required: ["text", "reference", "meaning"]
        }
      }
    });
    return response.text ? JSON.parse(response.text.trim()) : null;
  } catch { return null; }
};
