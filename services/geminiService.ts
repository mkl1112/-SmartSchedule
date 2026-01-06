
import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleEvent } from "../types";

// Always initialize GoogleGenAI using a named parameter with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSchedule = async (events: ScheduleEvent[], query: string) => {
  try {
    const context = JSON.stringify(events);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dưới đây là danh sách lịch công tác: ${context}. Trả lời câu hỏi: ${query}`,
      config: {
        systemInstruction: "Bạn là trợ lý ảo của UBND Thành phố. Trả lời ngắn gọn, chính xác dựa trên dữ liệu cung cấp."
      }
    });
    // Extracting text directly from the response object
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lỗi kết nối AI.";
  }
};

export const parseEventFromText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Trích xuất thông tin lịch họp từ văn bản sau: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            start_time: { type: Type.STRING, description: "HH:mm format" },
            end_time: { type: Type.STRING, description: "HH:mm format" },
            location: { type: Type.STRING },
            participants: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            category: { type: Type.STRING, enum: ['Họp', 'Công tác', 'Tiếp dân', 'Khác'] }
          },
          required: ["title", "date", "start_time"]
        }
      }
    });
    // Extract text from the response to parse as JSON
    const textOutput = response.text;
    return textOutput ? JSON.parse(textOutput) : null;
  } catch (error) {
    console.error("Parse Error:", error);
    return null;
  }
};
