
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, VerificationResult, LatLng } from "../types";

// Create a fresh client for every request to ensure the latest API key from process.env.API_KEY is used
const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Models definitions
const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const VISION_MODEL = 'gemini-3-pro-preview';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';

/**
 * Transcribes audio and extracts the topic and complexity level.
 */
export const transcribeAndParseIntent = async (base64Audio: string): Promise<{ topic?: string, level?: string }> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: 'audio/webm' } },
          { text: "Transcribe this request for an infographic and extract the primary topic and the target audience level (one of: Elementary, High School, College, Expert). If not mentioned, default level to High School. Return ONLY JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "The core subject matter" },
            level: { type: Type.STRING, description: "Complexity level" }
          },
          required: ["topic", "level"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Transcription failed", error);
    return {};
  }
};

const getLevelInstruction = (level: ComplexityLevel): string => {
  switch (level) {
    case 'Elementary':
      return "Target Audience: Elementary School (Ages 6-10). Style: Bright, simple, fun. Use large clear icons and very minimal text labels.";
    case 'High School':
      return "Target Audience: High School. Style: Standard Textbook. Clean lines, clear labels, accurate maps or diagrams. Avoid cartoony elements.";
    case 'College':
      return "Target Audience: University. Style: Academic Journal. High detail, data-rich, precise cross-sections or complex schematics.";
    case 'Expert':
      return "Target Audience: Industry Expert. Style: Technical Blueprint/Schematic. Extremely dense detail, monochrome or technical coloring, precise annotations.";
    default:
      return "Target Audience: General Public. Style: Clear and engaging.";
  }
};

const getStyleInstruction = (style: VisualStyle): string => {
  switch (style) {
    case 'Minimalist': return "Aesthetic: Bauhaus Minimalist. Flat vector art, limited color palette (2-3 colors), reliance on negative space and simple geometric shapes.";
    case 'Realistic': return "Aesthetic: Photorealistic Composite. Cinematic lighting, 8k resolution, highly detailed textures. Looks like a photograph.";
    case 'Cartoon': return "Aesthetic: Educational Comic. Vibrant colors, thick outlines, expressive cel-shaded style.";
    case 'Vintage': return "Aesthetic: 19th Century Scientific Lithograph. Engraving style, sepia tones, textured paper background, fine hatch lines.";
    case 'Futuristic': return "Aesthetic: Cyberpunk HUD. Glowing neon blue/cyan lines on dark background, holographic data visualization, 3D wireframes.";
    case '3D Render': return "Aesthetic: 3D Isometric Render. Claymorphism or high-gloss plastic texture, studio lighting, soft shadows, looks like a physical model.";
    case 'Sketch': return "Aesthetic: Da Vinci Notebook. Ink on parchment sketch, handwritten annotations style, rough but accurate lines.";
    default: return "Aesthetic: High-quality digital scientific illustration. Clean, modern, highly detailed.";
  }
};

/**
 * Researches a topic to create an infographic plan.
 * Uses Google Search and Maps Grounding.
 */
export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language,
  userLocation?: LatLng
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style);

  const systemPrompt = `
    You are an expert visual researcher.
    Your goal is to research the topic: "${topic}" and create a plan for an infographic.
    
    **IMPORTANT: Use the Google Search and Google Maps tools to find the most accurate, up-to-date information.**
    If the topic is geographic or a specific place, prioritize Google Maps for location-specific details and surroundings.
    
    Context:
    ${levelInstr}
    ${styleInstr}
    Language: ${language}
    
    Please provide your response in the following format:
    
    FACTS:
    - [Fact 1]
    - [Fact 2]
    - [Fact 3]
    
    IMAGE_PROMPT:
    [A highly detailed image generation prompt describing the visual composition, colors, and layout for the infographic.]
  `;

  try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: {
          parts: [{ text: systemPrompt }]
        },
        config: {
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
                latLng: userLocation
            }
          }
        },
      });

      const text = response.text || "";
      
      const factsMatch = text.match(/(?:^|\n)\**FACTS:?\**\s*([\s\S]*?)(?=(?:^|\n)\**IMAGE_PROMPT:?\**|$)/i);
      const factsRaw = factsMatch ? factsMatch[1].trim() : "";
      const facts = factsRaw.split('\n')
        .map(f => f.replace(/^-\s*/, '').trim())
        .filter(f => f.length > 0)
        .slice(0, 5);

      const promptMatch = text.match(/(?:^|\n)\**IMAGE_PROMPT:?\**\s*([\s\S]*?)$/i);
      const imagePrompt = promptMatch ? promptMatch[1].trim() : `Create a detailed infographic about ${topic}. ${levelInstr} ${styleInstr}`;

      const searchResults: SearchResultItem[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach(chunk => {
          if (chunk.web?.uri && chunk.web?.title) {
            searchResults.push({ title: chunk.web.title, url: chunk.web.uri, isMap: false });
          } else if (chunk.maps?.uri && chunk.maps?.title) {
            searchResults.push({ title: chunk.maps.title, url: chunk.maps.uri, isMap: true });
          }
        });
      }

      const uniqueResults = Array.from(new Map(searchResults.map(item => [item.url, item])).values());

      return {
        imagePrompt: imagePrompt,
        facts: facts,
        searchResults: uniqueResults
      };
  } catch (error) {
      console.error("Research failed:", error);
      throw error;
  }
};

export const generateInfographicImage = async (prompt: string): Promise<string> => {
  try {
      const response = await getAi().models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "16:9",
                imageSize: "1K"
            }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      throw new Error("No image generated.");
  } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
  }
};

/**
 * Generates a short explainer video using the Veo model.
 */
export const generateCinematicSummary = async (topic: string, imageBase64: string): Promise<string> => {
  const ai = getAi();
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  try {
      let operation = await ai.models.generateVideos({
        model: VEO_MODEL,
        prompt: `A cinematic, documentary-style motion graphics video explaining ${topic}. High resolution, smooth transitions, educational atmosphere.`,
        image: {
            imageBytes: cleanBase64,
            mimeType: 'image/png'
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed to return a link.");

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
  } catch (error) {
      console.error("Video generation failed:", error);
      throw error;
  }
};

export const verifyInfographicAccuracy = async (
  imageBase64: string, 
  facts: string[]
): Promise<VerificationResult> => {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const prompt = `Analyze this infographic. Facts: ${facts.join('; ')}. Check accuracy, legibility. Return JSON: {score, isAccurate, critique, suggestedFix}`;

  try {
      const response = await getAi().models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: prompt }
          ]
        },
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text);
      return { ...result, timestamp: Date.now() };
  } catch (error) {
      console.error("Verification failed:", error);
      throw error;
  }
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  try {
      const response = await getAi().models.generateContent({
        model: EDIT_MODEL,
        contents: {
          parts: [
             { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
             { text: editInstruction }
          ]
        }
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Edit failed");
  } catch (error) { throw error; }
};

export const generateAudioNarration = async (topic: string, facts: string[], language: Language): Promise<string> => {
  const contentPrompt = `Narrate summary of ${topic} in ${language}. Facts: ${facts.join(', ')}. Clear documentary voice.`;
  try {
      const response = await getAi().models.generateContent({
        model: TTS_MODEL,
        contents: { parts: [{ text: contentPrompt }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
        }
      });
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) return data;
      throw new Error("Audio failed");
  } catch (error) { throw error; }
};
