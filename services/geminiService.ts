import { GoogleGenAI } from "@google/genai";

export const generateReportSummary = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API Key missing. Cannot generate summary.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `สรุปรายละเอียดการใช้รถ/การซ่อม/การเติมน้ำมันนี้ ให้สั้นกระชับ เป็นทางการ สำหรับรายงานผู้อำนวยการโรงเรียน: ${text}`,
    });
    
    return response.text || "ไม่สามารถสร้างสรุปได้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
  }
};