
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DamageDetection } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export async function analyzeImage(base64Image: string): Promise<DamageDetection[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Analyze this car image for scratches, dents, or paint damage.
    AGENTIC FINGER FOCUS: Look specifically for fingers or hands pointing at parts of the car. 
    If a finger is pointing at a surface, treat the area near the fingertip as a high-priority inspection zone.
    
    Identify all suspicious areas. For each area, provide normalized coordinates [ymin, xmin, ymax, xmax] (0-1000 scale).
    If an area is near a pointing finger, categorize it with high confidence if damage is visible.
    If you find a spot that might be a reflection but it's not 100% clear, mark it for further zoom analysis by setting 'isConfirmedDamage' to false.
    
    Return the result strictly as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { 
                type: Type.STRING, 
                description: "Type of anomaly detected: 'scratch', 'dent', 'reflection', or 'other'" 
              },
              confidence: { type: Type.NUMBER },
              boundingBox: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER },
                description: "[ymin, xmin, ymax, xmax] coordinates" 
              },
              description: { type: Type.STRING },
              isConfirmedDamage: { 
                type: Type.BOOLEAN, 
                description: "True if definitively damage, False if it needs a high-detail zoom check" 
              }
            },
            required: ["type", "confidence", "boundingBox", "description", "isConfirmedDamage"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    This is a high-resolution zoomed-in view of a suspicious area on a car.
    Often, a finger is pointing to this specific area in the original context.
    
    Examine the surface texture, edges, and light refraction carefully.
    Identify if this is a physical scratch (depth/irregular edges), a dent, or just a reflection of the surroundings.
    
    Provide a professional, concise technical conclusion (2-3 sentences).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: zoomedBase64.split(',')[1] || zoomedBase64
              }
            }
          ]
        }
      ]
    });

    return response.text || "Detailed analysis inconclusive.";
  } catch (error) {
    console.error("Gemini Zoom Error:", error);
    return "Failed to complete detailed zoom analysis.";
  }
}
