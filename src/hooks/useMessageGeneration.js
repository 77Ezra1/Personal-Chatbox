/**
 * useMessageGeneration Hook
 * Extracted from App.jsx to improve code organization and reusability
 * Handles AI message generation logic with streaming support
 */

import { useState, useCallback, useRef } from 'react';
import { generateAIResponse } from '@/lib/aiClient';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useMessageGeneration');

/**
 * Hook for managing AI message generation
 * @param {Object} options - Hook options
 * @returns {Object} Message generation state and methods
 */
export function useMessageGeneration(options = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Generate AI message with streaming support
   */
  const generateMessage = useCallback(async ({
    messages,
    model,
    modelConfig,
    systemPrompt,
    tools,
    onToolCall,
    onComplete,
    onError,
    onChunk
  }) => {
    setIsGenerating(true);
    setStreamingMessage('');
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';
      let hasToolCalls = false;
      let toolCallsData = [];

      await generateAIResponse({
        messages,
        model,
        modelConfig,
        systemPrompt,
        tools,
        stream: true,
        signal: abortControllerRef.current.signal,
        onMessage: (chunk) => {
          if (chunk.type === 'content') {
            fullResponse += chunk.content;
            setStreamingMessage(fullResponse);

            // Call custom chunk handler if provided
            if (onChunk) {
              onChunk(chunk.content, fullResponse);
            }
          } else if (chunk.type === 'tool_call') {
            hasToolCalls = true;
            toolCallsData.push(chunk.data);
            logger.debug('Tool call received:', chunk.data);
          } else if (chunk.type === 'error') {
            logger.error('Stream error:', chunk.error);
            throw new Error(chunk.error);
          }
        }
      });

      // If there were tool calls, handle them
      if (hasToolCalls && onToolCall) {
        await onToolCall(toolCallsData);
      }

      // Call completion handler
      if (onComplete) {
        onComplete(fullResponse, { hasToolCalls, toolCallsData });
      }

      return {
        success: true,
        content: fullResponse,
        hasToolCalls,
        toolCallsData
      };

    } catch (error) {
      // Don't treat abort as an error
      if (error.name === 'AbortError') {
        logger.info('Message generation aborted');
        return {
          success: false,
          aborted: true
        };
      }

      logger.error('Message generation error:', error);
      setError(error);

      if (onError) {
        onError(error);
      }

      return {
        success: false,
        error: error.message
      };

    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Stop message generation
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      logger.info('Stopping message generation');
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Reset generation state
   */
  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setStreamingMessage('');
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isGenerating,
    streamingMessage,
    error,
    generateMessage,
    stopGeneration,
    resetGeneration
  };
}
