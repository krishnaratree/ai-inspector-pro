import { GoogleGenerativeAI } from "@google/generative-ai";

// ดึง API Key จาก Environment Variables ใน Netlify
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * ฟังก์ชันหลักสำหรับวิเคราะห์รูปภาพความเสียหายของรถ
 */
export const analyzeImage = async (base64Image: string) => {
  // ใช้โมเดล gemini-1.5-flash เพื่อความเร็วและรองรับ Bounding Box
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // บังคับตอบเป็น JSON
  });

  const prompt = `Analyze this car damage image. 
  Identify scratches, dents, or broken parts.
  Return the response STRICTLY as a JSON object with this structure:
  {
    "detections": [
      {
        "label": "damage type",
        "confidence": 0.9,
        "box_2d": [ymin, xmin, ymax, xmax] 
      }
    ],
    "summary": "overall description"
  }
  Note: box_2d coordinates should be normalized (0-1000).`;

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
  return response.text();
};

/**
 * ฟังก์ชันสำหรับการวิเคราะห์แบบเจาะจงจุด (Zoom) 
 * เพิ่มไว้เพื่อให้ App.tsx เรียกใช้งานได้ Build จะได้ไม่พัง
 */
export const zoomAnalysis = async (base64Image: string) => {
  // ปัจจุบันส่งไปที่ฟังก์ชันหลักเหมือนกัน เพื่อรักษาเสถียรภาพของแอป
  return analyzeImage(base64Image);
};
