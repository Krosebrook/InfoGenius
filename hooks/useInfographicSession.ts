/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import { GeneratedImage, ComplexityLevel, VisualStyle, Language, SearchResultItem, VerificationResult } from '../types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage, 
  verifyInfographicAccuracy 
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
  const [historyIndex, setHistoryIndex] = useState(0); // 0 is the newest
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);

  const addToHistory = (image: GeneratedImage) => {
      setImageHistory(prev => [image, ...prev]);
      setHistoryIndex(0);
  };

  const handleError = (err: any) => {
      console.error(err);
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. The selected API key does not have access to the required models. Please select a project with billing enabled.");
          onAuthError();
      } else {
          setError(err.message || 'An unexpected error occurred.');
      }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || !topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setCurrentSearchResults([]);
    setLoadingMessage(`Researching topic...`);

    try {
      const researchResult = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language);
      
      setLoadingFacts(researchResult.facts);
      setCurrentSearchResults(researchResult.searchResults);
      
      setLoadingStep(2);
      setLoadingMessage(`Designing Infographic...`);
      
      let base64Data = await generateInfographicImage(researchResult.imagePrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        data: base64Data,
        prompt: topic,
        originalTopic: topic,
        facts: researchResult.facts,
        timestamp: Date.now(),
        level: complexityLevel,
        style: visualStyle,
        language: language
      };

      addToHistory(newImage);
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
    setLoadingMessage(`Processing Modification: "${editPrompt}"...`);

    try {
      const base64Data = await editInfographicImage(currentImage.data, editPrompt);
      const newImage: GeneratedImage = {
        ...currentImage,
        id: Date.now().toString(),
        data: base64Data,
        prompt: editPrompt,
        timestamp: Date.now(),
        verification: undefined // Reset verification on edit
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
    
    // If no facts (e.g. loaded from old history or direct creation), can't verify accurately
    const facts = currentImage.facts || ["General knowledge about " + currentImage.prompt];

    setIsLoading(true);
    setLoadingMessage("Analyzing accuracy...");
    setLoadingStep(2);

    try {
        const result: VerificationResult = await verifyInfographicAccuracy(currentImage.data, facts);
        
        // Update the current image in history with the verification result
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
    setLoadingMessage('Fetching latest updates...');
    setLoadingStep(1);
    
    try {
      const researchResult = await researchTopicForPrompt(currentTopic, complexityLevel, visualStyle, language);
      setCurrentSearchResults(researchResult.searchResults);
      if (researchResult.facts.length > 0) {
        setLoadingFacts(researchResult.facts);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  return {
    topic, setTopic,
    complexityLevel, setComplexityLevel,
    visualStyle, setVisualStyle,
    language, setLanguage,
    isLoading, loadingMessage, loadingStep, loadingFacts, error, setError,
    imageHistory, setImageHistory, historyIndex, setHistoryIndex,
    currentSearchResults, setCurrentSearchResults,
    handleGenerate, handleEdit, handleVerify, handleRefreshNews
  };
};