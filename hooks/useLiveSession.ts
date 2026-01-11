/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeAudioData, pcmTo16BitBase64 } from '../services/audioUtils';

interface UseLiveSessionProps {
  onAuthError?: () => void;
}

export const useLiveSession = ({ onAuthError }: UseLiveSessionProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0); // 0-1 range for visualizer
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Stream References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Queue
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Session
  const activeSessionRef = useRef<Promise<any> | null>(null);

  const cleanup = useCallback(() => {
    // Stop Microphone
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    
    // Disconnect Input Audio Nodes
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }

    // Stop Output
    audioQueueRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
    });
    audioQueueRef.current = [];
    
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    
    // Close Session (Not explicitly possible with current SDK promise, but we reset refs)
    // Note: The SDK doesn't expose a direct close() method on the session object easily in the example,
    // but the connection will time out or close when the context is destroyed.
    // Ideally we would call session.close() if stored.
    activeSessionRef.current = null;

    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  }, []);

  const connect = async (imageBase64: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);

    try {
        // 1. Initialize Audio Contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
        outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        nextStartTimeRef.current = outputContextRef.current.currentTime;

        // 2. Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // 3. Connect to Gemini Live
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Clean base64 for input
        const cleanImage = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: "You are an expert tutor discussing the attached infographic. Keep answers concise, engaging, and conversational.",
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            },
            callbacks: {
                onopen: async () => {
                    console.log("Gemini Live Connected");
                    setIsConnected(true);
                    setIsConnecting(false);
                    
                    // Send the infographic immediately as context
                    activeSessionRef.current?.then(session => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'image/jpeg',
                                data: cleanImage
                            }
                        });
                        // Send an initial silent input to wake it up or just wait for user speech
                    });
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Audio Output
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData && outputContextRef.current) {
                        try {
                            const buffer = await decodeAudioData(audioData, outputContextRef.current, 24000);
                            
                            // Schedule playback
                            const ctx = outputContextRef.current;
                            // Ensure we don't schedule in the past
                            const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            source.start(startTime);
                            
                            nextStartTimeRef.current = startTime + buffer.duration;
                            audioQueueRef.current.push(source);
                            
                            source.onended = () => {
                                const idx = audioQueueRef.current.indexOf(source);
                                if (idx > -1) audioQueueRef.current.splice(idx, 1);
                            };

                        } catch (e) {
                            console.error("Error decoding audio chunk", e);
                        }
                    }

                    // Handle Interruption
                    if (message.serverContent?.interrupted) {
                         audioQueueRef.current.forEach(src => {
                             try { src.stop(); } catch(e) {}
                         });
                         audioQueueRef.current = [];
                         if (outputContextRef.current) {
                            nextStartTimeRef.current = outputContextRef.current.currentTime;
                         }
                    }
                },
                onclose: () => {
                    console.log("Gemini Live Closed");
                    cleanup();
                },
                onerror: (e) => {
                    console.error("Gemini Live Error", e);
                    setError("Connection lost.");
                    cleanup();
                }
            }
        });

        activeSessionRef.current = sessionPromise;

        // 4. Setup Input Streaming (Microphone -> Gemini)
        if (inputContextRef.current) {
            const source = inputContextRef.current.createMediaStreamSource(stream);
            // Use ScriptProcessor for 16kHz PCM streaming (4096 buffer size)
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate Volume for Visualizer
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(rms);

                // Send to Gemini
                const b64PCM = pcmTo16BitBase64(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: b64PCM
                        }
                    });
                });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
            
            sourceRef.current = source;
            processorRef.current = processor;
        }

    } catch (e: any) {
        console.error("Failed to start live session", e);
        setError("Failed to access microphone or connect.");
        if (e.message?.includes("403") || e.message?.includes("permission")) {
             onAuthError?.();
        }
        cleanup();
    }
  };

  const disconnect = () => {
      // If there is an active session, try to send a close message if the SDK supported it,
      // but cleaning up the socket/context is usually enough.
      cleanup();
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          cleanup();
      };
  }, [cleanup]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    volume,
    error
  };
};
