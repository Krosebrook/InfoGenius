
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import { GeneratedImage, ComplexityLevel, VisualStyle, Language, SearchResultItem, VerificationResult, LatLng } from '../types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage, 
  verifyInfographicAccuracy,
  generateCinematicSummary
} from '../services/geminiService';

interface UseInfographicSessionProps {
  onAuthError: () => void;
}

export const useInfographicSession = ({ onAuthError }: UseInfographicSessionProps) => {
  const [topic, setTopic] = useState('');
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>('High School');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Default');
  const [language, setLanguage] = useState<Language>('English');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingFacts, setLoadingFacts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0); 
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);

  const addToHistory = (image: GeneratedImage) => {
      setImageHistory(prev => [image, ...prev]);
      setHistoryIndex(0);
  };

  const getUserLocation = (): Promise<LatLng | undefined> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 5000 }
        );
    });
  };

  const handleError = (err: any) => {
      console.error(err);
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. Ensure you have a paid API key selected for these models.");
          onAuthError();
      } else {
          setError(err.message || 'An unexpected error occurred.');
      }
  };

  const executeGeneration = async (
    t: string, 
    l: ComplexityLevel, 
    v: VisualStyle, 
    lng: Language
  ) => {
    if (isLoading || !t.trim()) return;

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setCurrentSearchResults([]);
    setLoadingMessage(`Consulting Knowledge Base...`);

    try {
      const location = await getUserLocation();
      const researchResult = await researchTopicForPrompt(t, l, v, lng, location);
      
      setLoadingFacts(researchResult.facts);
      setCurrentSearchResults(researchResult.searchResults);
      
      setLoadingStep(2);
      setLoadingMessage(`Synthesizing Visual Layout...`);
      
      let base64Data = await generateInfographicImage(researchResult.imagePrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        data: base64Data,
        prompt: t,
        originalTopic: t,
        facts: researchResult.facts,
        timestamp: Date.now(),
        level: l,
        style: v,
        language: lng
      };

      addToHistory(newImage);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeGeneration(topic, complexityLevel, visualStyle, language);
  };

  const handleAutoGenerate = async (t: string, l: ComplexityLevel, v: VisualStyle, lng: Language) => {
      setTopic(t);
      setComplexityLevel(l);
      setVisualStyle(v);
      setLanguage(lng);
      await executeGeneration(t, l, v, lng);
  };

  const handleAnimate = async () => {
    if (imageHistory.length === 0) return;
    const currentImage = imageHistory[historyIndex];
    if (currentImage.videoUri) return; // Already animated

    setIsLoading(true);
    setError(null);
    setLoadingStep(3); // Specialized video step
    setLoadingMessage(`Cinematic Animation Processing... (May take 1-2 mins)`);

    try {
        const videoUri = await generateCinematicSummary(currentImage.originalTopic || currentImage.prompt, currentImage.data);
        
        // Update history item with video
        const updatedImage = { ...currentImage, videoUri };
        const newHistory = [...imageHistory];
        newHistory[historyIndex] = updatedImage;
        setImageHistory(newHistory);
    } catch (err: any) {
        handleError(err);
    } finally {
        setIsLoading(false);
        setLoadingStep(0);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (imageHistory.length === 0) return;
    const currentImage = imageHistory[historyIndex];
    setIsLoading(true);
    setError(null);
    setLoadingStep(2);
    setLoadingMessage(`Refining Canvas: "${editPrompt}"...`);

    try {
      const base64Data = await editInfographicImage(currentImage.data, editPrompt);
      const newImage: GeneratedImage = {
        ...currentImage,
        id: Date.now().toString(),
        data: base64Data,
        prompt: editPrompt,
        timestamp: Date.now(),
        verification: undefined,
        videoUri: undefined // Reset video on edit
      };
      addToHistory(newImage);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleVerify = async () => {
    if (imageHistory.length === 0) return;
    const currentImage = imageHistory[historyIndex];
    const facts = currentImage.facts || ["General knowledge about " + currentImage.prompt];

    setIsLoading(true);
    setLoadingMessage("Validating Visual Data...");
    setLoadingStep(2);

    try {
        const result: VerificationResult = await verifyInfographicAccuracy(currentImage.data, facts);
        const updatedImage = { ...currentImage, verification: result };
        const newHistory = [...imageHistory];
        newHistory[historyIndex] = updatedImage;
        setImageHistory(newHistory);
    } catch (err: any) {
        handleError(err);
    } finally {
        setIsLoading(false);
        setLoadingStep(0);
    }
  };

  const handleRefreshNews = async () => {
    if (imageHistory.length === 0) return;
    const currentTopic = imageHistory[historyIndex].prompt;
    setIsLoading(true);
    setLoadingMessage('Fetching Geographic & Search Updates...');
    setLoadingStep(1);
    try {
      const location = await getUserLocation();
      const researchResult = await researchTopicForPrompt(currentTopic, complexityLevel, visualStyle, language, location);
      setCurrentSearchResults(researchResult.searchResults);
      if (researchResult.facts.length > 0) setLoadingFacts(researchResult.facts);
    } catch (err: any) { handleError(err); } finally { setIsLoading(false); setLoadingStep(0); }
  };

  return {
    topic, setTopic,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    isLoading, loadingMessage, loadingStep, loadingFacts, error, setError,
    imageHistory, setImageHistory, historyIndex, setHistoryIndex,
    currentSearchResults, setCurrentSearchResults,
    handleGenerate, handleAnimate, handleEdit, handleVerify, handleRefreshNews,
    handleAutoGenerate
  };
};
