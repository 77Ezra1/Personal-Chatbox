/**
 * useToolCalling Hook
 * Extracted from App.jsx to handle MCP tool execution
 * Manages tool call state and execution logic
 */

import { useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useToolCalling');

/**
 * Hook for managing tool calling
 * @param {Object} mcpManager - MCP manager instance with callTool method
 * @returns {Object} Tool calling state and methods
 */
export function useToolCalling(mcpManager) {
  const [activeTools, setActiveTools] = useState([]);
  const [toolResults, setToolResults] = useState([]);
  const [toolError, setToolError] = useState(null);

  /**
   * Execute a single tool call
   */
  const executeToolCall = useCallback(async (toolCall) => {
    if (!mcpManager || !mcpManager.callTool) {
      logger.error('MCP manager not available');
      throw new Error('MCP manager not configured');
    }

    const toolId = toolCall.id || toolCall.function?.name;
    const toolName = toolCall.function?.name || toolCall.name;
    const toolArgs = toolCall.function?.arguments || toolCall.arguments;

    logger.info(`Executing tool: ${toolName}`, { toolId, args: toolArgs });

    // Add to active tools
    setActiveTools(prev => [...prev, toolId]);

    try {
      // Parse arguments if they're a string
      const parsedArgs = typeof toolArgs === 'string'
        ? JSON.parse(toolArgs)
        : toolArgs;

      // Execute the tool
      const result = await mcpManager.callTool(toolName, parsedArgs);

      logger.info(`Tool ${toolName} completed successfully`, { result });

      // Remove from active tools
      setActiveTools(prev => prev.filter(id => id !== toolId));

      // Format as tool message for AI
      const toolMessage = {
        tool_call_id: toolId,
        role: 'tool',
        name: toolName,
        content: JSON.stringify(result)
      };

      // Add to results
      setToolResults(prev => [...prev, toolMessage]);

      return toolMessage;

    } catch (error) {
      logger.error(`Tool ${toolName} failed:`, error);

      // Remove from active tools
      setActiveTools(prev => prev.filter(id => id !== toolId));

      setToolError(error);

      // Return error as tool message
      const errorMessage = {
        tool_call_id: toolId,
        role: 'tool',
        name: toolName,
        content: JSON.stringify({
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      };

      setToolResults(prev => [...prev, errorMessage]);

      return errorMessage;
    }
  }, [mcpManager]);

  /**
   * Execute multiple tool calls in parallel
   */
  const executeMultipleToolCalls = useCallback(async (toolCalls) => {
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return [];
    }

    logger.info(`Executing ${toolCalls.length} tool calls`);

    try {
      // Execute all tools in parallel
      const results = await Promise.all(
        toolCalls.map(toolCall => executeToolCall(toolCall))
      );

      logger.info('All tool calls completed', { count: results.length });

      return results;

    } catch (error) {
      logger.error('Error executing multiple tool calls:', error);
      throw error;
    }
  }, [executeToolCall]);

  /**
   * Execute tool calls sequentially (one at a time)
   */
  const executeSequentialToolCalls = useCallback(async (toolCalls) => {
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return [];
    }

    logger.info(`Executing ${toolCalls.length} tool calls sequentially`);

    const results = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await executeToolCall(toolCall);
        results.push(result);
      } catch (error) {
        // Continue with other tools even if one fails
        logger.warn('Tool call failed, continuing with others:', error);
      }
    }

    logger.info('Sequential tool calls completed', { count: results.length });

    return results;
  }, [executeToolCall]);

  /**
   * Clear tool results
   */
  const clearToolResults = useCallback(() => {
    setToolResults([]);
    setToolError(null);
  }, []);

  /**
   * Check if any tools are currently executing
   */
  const hasActiveTools = activeTools.length > 0;

  /**
   * Get tool call status
   */
  const getToolStatus = useCallback((toolId) => {
    return {
      isActive: activeTools.includes(toolId),
      hasResult: toolResults.some(r => r.tool_call_id === toolId),
      result: toolResults.find(r => r.tool_call_id === toolId)
    };
  }, [activeTools, toolResults]);

  return {
    // State
    activeTools,
    toolResults,
    toolError,
    hasActiveTools,

    // Methods
    executeToolCall,
    executeMultipleToolCalls,
    executeSequentialToolCalls,
    clearToolResults,
    getToolStatus
  };
}
