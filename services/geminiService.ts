import { GoogleGenAI, Type } from "@google/genai";
import { FinancialPrediction, BibleVerse } from "../types";

// Lazy initialization of the AI client to avoid crashes if API Key is missing on module load
const getAiClient = () => {
  const apiKey = import.meta.env?.VITE_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialPrediction = async (
  currentRevenue: number,
  pendingRevenue: number,
  expenses: number,
  activeProjectsCount: number
): Promise<FinancialPrediction | null> => {
  const ai = getAiClient();

  if (!ai) {
    console.warn("API Key do Google Gemini não encontrada (VITE_API_KEY).");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        role: "user",
        parts: [{
          text: `Analise o cenário financeiro desta marcenaria:
          - Faturamento Realizado: R$ ${currentRevenue}
          - Faturamento Pendente (Sinais/A receber): R$ ${pendingRevenue}
          - Total de Despesas (Fixas + Materiais): R$ ${expenses}
          - Projetos Ativos em Produção: ${activeProjectsCount}
          
          Forneça uma previsão para o próximo mês, identifique riscos e sugira melhorias.`
        }]
      },
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

    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("Financial prediction failed:", error);
    return null;
  }
};

export const getDailyVerse = async (): Promise<BibleVerse | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        role: "user",
        parts: [{ text: "Selecione um versículo bíblico motivador que se relacione com trabalho duro, excelência ou carpintaria." }]
      },
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
    
    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch { return null; }
};