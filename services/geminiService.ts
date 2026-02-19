import { GoogleGenerativeAI } from "@google/generative-ai";

// ใช้ API Key จาก Environment Variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeImage = async (base64Image: string) => {
  // เปลี่ยนมาใช้ชื่อโมเดลแบบเจาะจงเพื่อเลี่ยง Error 404
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest" 
  });

  const prompt = `Identify car damages. 
  Return ONLY a JSON object with this format:
  {"detections": [{"label": "dent", "box_2d": [ymin, xmin, ymax, xmax]}]}
  Coordinates must be 0-1000. Do not include markdown formatting like \`\`\`json.`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // ล้างข้อความส่วนเกินที่ AI อาจจะแถมมาเพื่อให้ JSON.parse ทำงานได้
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const zoomAnalysis = async (base64Image: string) => {
  return analyzeImage(base64Image);
};
