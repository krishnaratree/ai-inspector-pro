import { GoogleGenerativeAI } from "@google/generative-ai";
import { DamageDetection } from "../types";

// ปรับชื่อ Model เป็นตัวที่เสถียรและเร็วที่สุดสำหรับการทำ Bounding Box
const MODEL_NAME = 'gemini-1.5-flash';

// ดึง API Key ผ่านระบบของ Vite ที่เชื่อมกับ Environment Variables ของ Netlify
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

export async function analyzeImage(base64Image: string): Promise<DamageDetection[]> {
  // แก้ไขการเรียกใช้ GoogleGenAI ให้ถูกต้องตาม SDK ล่าสุด
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
    }
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
    const imageData = base64Image.split(',')[1] || base64Image;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const results = JSON.parse(text || '[]');
    
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
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
    This is a high-resolution zoomed-in view of a suspicious area on a car.
    Often, a finger is pointing to this specific area in the original context.
    
    Examine the surface texture, edges, and light refraction carefully.
    Identify if this is a physical scratch (depth/irregular edges), a dent, or just a reflection of the surroundings.
    
    Provide a professional, concise technical conclusion (2-3 sentences).
  `;

  try {
    const zoomedData = zoomedBase64.split(',')[1] || zoomedBase64;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: zoomedData
        }
      }
    ]);

    const response = await result.response;
    return response.text() || "Detailed analysis inconclusive.";
  } catch (error) {
    console.error("Gemini Zoom Error:", error);
    return "Failed to complete detailed zoom analysis.";
  }
}
