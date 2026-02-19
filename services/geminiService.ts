import { GoogleGenerativeAI } from "@google/generative-ai";

// ดึง API Key จาก Netlify Environment Variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeImage = async (base64Image: string) => {
  // แก้ไขชื่อโมเดลเป็น gemini-1.5-flash แบบมาตรฐาน
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analyze this car damage. 
  Return the response as a JSON object with a 'detections' array.
  Each detection must have 'label' (e.g., 'scratch', 'dent') 
  and 'box_2d' [ymin, xmin, ymax, xmax] coordinates.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
  ]);

  const response = await result.response;
  return response.text();
};
