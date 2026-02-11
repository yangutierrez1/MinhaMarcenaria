import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 1. Corrigido de GoogleGenAI para GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    // 2. Corrigido de 'Type' para 'SchemaType'
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        resposta: {
          type: SchemaType.STRING,
        },
        // Adicione outros campos do seu schema aqui seguindo o mesmo padrão
      },
    },
  },
});

// Exemplo de como deve ser a estrutura do Schema se você estiver usando um:
const schema = {
  description: "Exemplo de schema",
  type: SchemaType.OBJECT,
  properties: {
    projeto: { type: SchemaType.STRING },
    valor: { type: SchemaType.NUMBER },
  },
  required: ["projeto"],
};