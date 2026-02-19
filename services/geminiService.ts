import { GoogleGenerativeAI } from "@google/generative-ai";

// ใช้ API Key จาก Netlify Environment Variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeImage = async (base64Image: string) => {
  // แก้ไข: ใช้ชื่อโมเดล "gemini-1.5-flash" (ตัด -latest ออก) 
  // และไม่ใส่ configuration ซับซ้อนในบรรทัดนี้
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Identify car damages (scratches, dents). 
  Return ONLY a JSON object: {"detections": [{"label": "damage type", "box_2d": [ymin, xmin, ymax, xmax]}]}
  Coordinates 0-1000. No extra text.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    // ส่งค่าว่างกลับไปเพื่อให้แอปไม่ค้าง และเราจะเห็น Error ใน Console ชัดขึ้น
    return JSON.stringify({ detections: [], summary: "Error: " + error });
  }
};

export const zoomAnalysis = async (base64Image: string) => {
  return analyzeImage(base64Image);
};
