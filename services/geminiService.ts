import { GoogleGenerativeAI } from "@google/generative-ai";
import { DamageDetection } from "../types";

// ใช้รุ่นที่เสถียรที่สุดสำหรับงาน Vision
const MODEL_NAME = 'gemini-1.5-flash';

/**
 * ฟังก์ชันช่วยดึง API Key ให้รองรับทั้ง Vite (Local) และ Netlify (Production)
 */
const getApiKey = () => {
  // ลองดึงจาก Vite env (มาตรฐานสูงสุด)
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  // ลองดึงจาก Define plugin (ที่เซ็ตใน vite.config)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  return '';
};

export async function analyzeImage(base64Image: string): Promise<DamageDetection[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please check your Netlify Environment Variables.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Analyze this car image for scratches, dents, or paint damage.
    AGENTIC FINGER FOCUS: Look specifically for fingers or hands pointing at parts of the car. 
    If a finger is pointing at a surface, treat the area near the fingertip as a high-priority inspection zone.
    
    Identify all suspicious areas. For each area, provide normalized coordinates [ymin, xmin, ymax, xmax] (0-1000 scale).
    If an area is near a pointing finger, categorize it with high confidence if damage is visible.
    If you find a spot that might be a reflection but it's not 100% clear, mark it for further zoom analysis by setting 'isConfirmedDamage' to false.
    
    Return the result strictly as a JSON array of objects with these properties:
    type (scratch, dent, reflection, other), confidence (0-1), boundingBox ([ymin, xmin, ymax, xmax]), description, isConfirmedDamage (boolean).
  `;

  try {
    const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: imageData } }
    ]);

    const response = await result.response;
    const results = JSON.parse(response.text() || '[]');
    
    return results.map((r: any, index: number) => ({
      ...r,
      id: `det-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    throw error;
  }
}

export async function zoomAnalysis(originalBase64: string, zoomedBase64: string, initialDescription: string): Promise<string> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
    This is a high-resolution zoomed-in view of a suspicious area on a car.
    Context: ${initialDescription}
    
    Examine the surface texture, edges, and light refraction carefully.
    Identify if this is a physical scratch, a dent, or just a reflection.
    Provide a professional, concise technical conclusion (2-3 sentences).
  `;

  try {
    const zoomedData = zoomedBase64.includes(',') ? zoomedBase64.split(',')[1] : zoomedBase64;
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: "image/jpeg", data: zoomedData } }
    ]);
    return result.response.text() || "Analysis inconclusive.";
  } catch (error) {
    return "Detailed analysis failed.";
  }
}
