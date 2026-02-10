import { GoogleGenerativeAI } from "@google/generative-ai";
import { FinancialPrediction, BibleVerse } from "../types";

// Inicialização segura do cliente de IA
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    return null;
  }
  // CORREÇÃO: Passando a string da chave diretamente
  return new GoogleGenerativeAI(apiKey);
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
    // CORREÇÃO: Usando getGenerativeModel em vez de .models
    const model = ai.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Atue como um consultor financeiro para marcenaria. 
    Receita atual: ${currentRevenue}, Receita pendente: ${pendingRevenue}, 
    Despesas: ${expenses}, Projetos ativos: ${activeProjectsCount}.
    Retorne um JSON com: status (string), message (string), recommendations (array de strings).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Erro na previsão financeira:", error);
    return null;
  }
};

export const getDailyVerse = async (): Promise<BibleVerse | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-pro" });
    const prompt = "Retorne um versículo bíblico motivador para um marceneiro em formato JSON com campos 'text' e 'reference'.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Erro ao obter versículo:", error);
    return null;
  }
};
