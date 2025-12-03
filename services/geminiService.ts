import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBirthdayMessage = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short, heartwarming, and poetic 1st birthday wish for a baby boy. Keep it under 30 words. The tone should be soft, joyful, and celebratory.",
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Happy 1st Birthday to our little sunshine!";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Happy 1st Birthday! One year of love and joy.";
  }
};