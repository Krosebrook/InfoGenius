/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, VerificationResult } from "../types";

// Create a fresh client for every request to ensure the latest API key from process.env.API_KEY is used
const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Updated models based on requirements
const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
// Using Gemini 3 Pro for Multimodal Analysis (Vision)
const VISION_MODEL = 'gemini-3-pro-preview';

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
 * Uses Google Search Grounding to find facts.
 */
export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style);

  const systemPrompt = `
    You are an expert visual researcher.
    Your goal is to research the topic: "${topic}" and create a plan for an infographic.
    
    **IMPORTANT: Use the Google Search tool to find the most accurate, up-to-date information about this topic.**
    
    Context:
    ${levelInstr}
    ${styleInstr}
    Language: ${language}
    
    Please provide your response in the following format EXACTLY:
    
    FACTS:
    - [Fact 1]
    - [Fact 2]
    - [Fact 3]
    
    IMAGE_PROMPT:
    [A highly detailed image generation prompt describing the visual composition, colors, and layout for the infographic. Do not include citations in the prompt.]
  `;

  try {
      const response = await getAi().models.generateContent({
        model: TEXT_MODEL,
        contents: {
          parts: [{ text: systemPrompt }]
        },
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      
      // Parse Facts with tolerant regex handling optional markdown bolding
      const factsMatch = text.match(/(?:^|\n)\**FACTS:?\**\s*([\s\S]*?)(?=(?:^|\n)\**IMAGE_PROMPT:?\**|$)/i);
      const factsRaw = factsMatch ? factsMatch[1].trim() : "";
      const facts = factsRaw.split('\n')
        .map(f => f.replace(/^-\s*/, '').trim())
        .filter(f => f.length > 0)
        .slice(0, 5);

      // Parse Prompt with tolerant regex
      const promptMatch = text.match(/(?:^|\n)\**IMAGE_PROMPT:?\**\s*([\s\S]*?)$/i);
      const imagePrompt = promptMatch ? promptMatch[1].trim() : `Create a detailed infographic about ${topic}. ${levelInstr} ${styleInstr}`;

      // Extract Grounding (Search Results)
      const searchResults: SearchResultItem[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach(chunk => {
          if (chunk.web?.uri && chunk.web?.title) {
            searchResults.push({
              title: chunk.web.title,
              url: chunk.web.uri
            });
          }
        });
      }

      // Remove duplicates based on URL
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

/**
 * Generates an infographic image based on the prompt.
 * Uses the Gemini 3 Pro Image Preview model.
 */
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

      // Iterate through parts to find the image, as per guidelines
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      
      throw new Error("No image generated in response. The model might have returned text instead.");
  } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
  }
};

/**
 * Verifies the accuracy of the generated infographic.
 * Uses Gemini 3 Pro (Vision) to analyze the image against the facts.
 */
export const verifyInfographicAccuracy = async (
  imageBase64: string, 
  facts: string[]
): Promise<VerificationResult> => {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const prompt = `
    Analyze this infographic image.
    Compare it against the following facts used to generate it:
    ${facts.map(f => `- ${f}`).join('\n')}

    Your task:
    1. Identify if the text in the image is legible and spelled correctly.
    2. Check if the visual representation contradicts the facts (hallucinations).
    3. Provide a brief critique.
    4. Provide a suggested fix prompt if there are issues.

    Format your response EXACTLY as this JSON:
    {
      "score": [number 0-100],
      "isAccurate": [boolean],
      "critique": "[string summary of issues or praise]",
      "suggestedFix": "[string prompt to fix issues, or null if accurate]"
    }
  `;

  try {
      const response = await getAi().models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: prompt }
          ]
        },
        config: {
            responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("Failed to verify image");

      try {
          const result = JSON.parse(text);
          return {
              score: result.score,
              isAccurate: result.isAccurate,
              critique: result.critique,
              suggestedFix: result.suggestedFix,
              timestamp: Date.now()
          };
      } catch (e) {
          console.error("Failed to parse verification JSON", text);
          return {
              score: 50,
              isAccurate: false,
              critique: "Failed to parse verification result. Raw response: " + text.substring(0, 100),
              timestamp: Date.now()
          };
      }
  } catch (error) {
      console.error("Verification failed:", error);
      throw error;
  }
};

export const fixInfographicImage = async (currentImageBase64: string, correctionPrompt: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const prompt = `
    Edit this image. 
    Goal: Simplify and Fix.
    Instruction: ${correctionPrompt}.
    Ensure the design is clean and any text is large and legible.
  `;

  try {
      const response = await getAi().models.generateContent({
        model: EDIT_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: prompt }
          ]
        }
        // Removed responseModalities for better compatibility with edit models unless strictly required
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      throw new Error("Failed to fix image");
  } catch (error) {
      console.error("Fix image failed:", error);
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
        // Removed responseModalities
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      throw new Error("Failed to edit image");
  } catch (error) {
      console.error("Edit image failed:", error);
      throw error;
  }
};

/**
 * Generates an audio narration summary of the topic.
 * Uses Gemini 2.5 Flash TTS.
 */
export const generateAudioNarration = async (topic: string, facts: string[], language: Language): Promise<string> => {
  let contentPrompt = `Narrate a short, engaging, and educational summary about "${topic}".\nAudience Language: ${language}.\n`;
  
  if (facts && facts.length > 0) {
    contentPrompt += `Base the narration on these key facts, but weave them into a coherent story:\n${facts.map(f => `- ${f}`).join('\n')}\n`;
  } else {
    contentPrompt += `Provide a concise overview suitable for a general audience.\n`;
  }
  
  contentPrompt += `Keep it under 30 seconds. Speak clearly and enthusiastically like a science documentary narrator.`;

  try {
      const response = await getAi().models.generateContent({
        model: TTS_MODEL,
        contents: {
          parts: [{ text: contentPrompt }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' } // 'Fenrir' is a deep, authoritative narrator voice
            }
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return part.inlineData.data; // Return base64 PCM data
      }
      throw new Error("Failed to generate audio");
  } catch (error) {
      console.error("Audio generation failed:", error);
      throw error;
  }
};
