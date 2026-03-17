/**
 * OpenAI Configuration
 * Load OpenAI API settings from environment variables
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
};

/**
 * Validate OpenAI configuration
 */
export function validateOpenAIConfig() {
  if (!openaiConfig.apiKey || openaiConfig.apiKey === 'your_openai_api_key_here') {
    console.warn('⚠️ OPENAI_API_KEY not configured. LLM explanations will be disabled.');
    return false;
  }
  return true;
}

/**
 * Check if OpenAI is enabled
 */
export function isOpenAIEnabled() {
  return validateOpenAIConfig();
}
