import { GoogleGenerativeAI } from "@google/generative-ai";
import { FinancialPrediction, BibleVerse } from "../types";

// Função auxiliar para inicializar o modelo com segurança
const getAiModel = () => {
  const apiKey = import.meta.env?.VITE_API_KEY;
  if (!apiKey) {
    console.warn("API Key do Google Gemini não encontrada (VITE_API_KEY).");
    return null;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash"
    // generationConfig removido para evitar erro de tipo TS, o JSON será forçado via prompt
  });
};

export const getFinancialPrediction = async (
  currentRevenue: number,
  pendingRevenue: number,
  expenses: number,
  activeProjectsCount: number
): Promise<FinancialPrediction | null> => {
  const model = getAiModel();
  if (!model) return null;

  const prompt = `
    Analise o cenário financeiro desta marcenaria e retorne APENAS um objeto JSON válido (sem markdown, sem backticks) com o seguinte formato:
    {
      "estimatedRevenue": number,
      "estimatedProfit": number,
      "riskAlerts": ["string"],
      "suggestions": ["string"]
    }

    Dados atuais:
    - Faturamento Realizado: R$ ${currentRevenue}
    - Faturamento Pendente (Sinais/A receber): R$ ${pendingRevenue}
    - Total de Despesas (Fixas + Materiais): R$ ${expenses}
    - Projetos Ativos em Produção: ${activeProjectsCount}
    
    Baseado nisso, calcule uma previsão realista para o próximo mês.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpeza de segurança para remover ```json e ``` caso a IA os inclua
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanText) as FinancialPrediction;
  } catch (error) {
    console.error("Financial prediction failed:", error);
    return null;
  }
};

export const getDailyVerse = async (): Promise<BibleVerse | null> => {
  const model = getAiModel();
  if (!model) return null;

  const prompt = `
    Selecione um versículo bíblico motivador que se relacione com trabalho duro, excelência, sabedoria ou construção/carpintaria.
    Retorne APENAS um objeto JSON válido (sem markdown, sem backticks) no seguinte formato:
    {
      "text": "O texto do versículo",
      "reference": "Livro Capítulo:Versículo",
      "meaning": "Uma breve explicação de uma frase sobre como isso se aplica ao trabalho"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanText) as BibleVerse;
  } catch (error) {
    console.error("Daily verse failed:", error);
    return null;
  }
};