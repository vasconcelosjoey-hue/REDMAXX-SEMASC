
import { GoogleGenAI, Type } from "@google/genai";

// Use API_KEY directly from process.env as per guidelines.
export const extractDataFromImage = async (base64Image: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image,
          },
        },
        {
          text: `Extraia os números desta imagem de status de envio. 
          Procure pelos seguintes campos: 
          - 'Mensagens Enviadas' ou 'Enviado'
          - 'Contatos Não São WhatsApp' ou 'Não é WhatsApp'
          - 'Cadastros Sem Número' ou 'Sem Número'
          - 'Itens Para Enviar' ou 'Para Enviar'
          - O período de datas mencionado (ex: 02/01/26 a 19/01/26)

          Retorne no formato JSON.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          enviado: { type: Type.NUMBER, description: "Número de mensagens enviadas" },
          naoWhatsapp: { type: Type.NUMBER, description: "Número de contatos que não são WhatsApp" },
          semNumero: { type: Type.NUMBER, description: "Número de cadastros sem número" },
          paraEnviar: { type: Type.NUMBER, description: "Itens pendentes para enviar" },
          periodo: { type: Type.STRING, description: "O intervalo de datas encontrado" },
        },
        required: ["enviado", "naoWhatsapp", "semNumero", "paraEnviar"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
