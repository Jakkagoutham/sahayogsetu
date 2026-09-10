const path = require('path');
const { Groq, toFile } = require('groq-sdk');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY || '' });

const CANDIDATE_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "groq/compound-mini",
  "qwen/qwen3.6-27b"
];

function parseJsonFromResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err2) {
        return null;
      }
    }
    return null;
  }
}

async function runGroqCompletion(messages, maxTokens = 500) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens
      });
      const content = completion.choices[0]?.message?.content;
      if (content) return { content, model };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed in voiceService: ${err.message}. Trying next candidate...`);
    }
  }
  throw lastError || new Error("All Groq models failed.");
}

/**
 * Transcribes audio via Groq Whisper and structures civic details via LLM
 */
async function processVoiceAudio(audioBuffer, mimeType = 'audio/webm', languageHint = '') {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('No audio buffer provided.');
  }

  // Determine file extension
  let ext = 'webm';
  if (mimeType.includes('wav')) ext = 'wav';
  else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a';
  else if (mimeType.includes('ogg')) ext = 'ogg';
  else if (mimeType.includes('mp3')) ext = 'mp3';

  // 1. Transcribe via Groq Whisper
  const file = await toFile(audioBuffer, `voice_recording.${ext}`, { type: mimeType });

  const transcriptionParams = {
    file,
    model: 'whisper-large-v3',
    response_format: 'json'
  };

  if (languageHint && languageHint !== 'auto') {
    transcriptionParams.language = languageHint;
  }

  console.log(`[VOICE INTAKE] Sending ${audioBuffer.length} bytes to Groq Whisper (hint: ${languageHint || 'auto'})...`);
  const whisperResult = await groq.audio.transcriptions.create(transcriptionParams);
  const rawText = whisperResult.text ? whisperResult.text.trim() : '';

  if (!rawText) {
    return {
      success: false,
      message: 'No audible speech detected. Please speak clearly into the microphone.'
    };
  }

  console.log(`[VOICE INTAKE] Whisper Transcribed: "${rawText}"`);

  // 2. Extract structured civic problem data via LLM
  return await structureSpokenGrievance(rawText);
}

/**
 * Takes spoken regional text and auto-extracts structured fields for the problem form
 */
async function structureSpokenGrievance(spokenText) {
  const prompt = `You are the AI Civic Grievance Intake Specialist for SahayogSetu, an official Indian Government and Public Grievance Portal.
A citizen has spoken a societal complaint in their native language (e.g. Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, English, or a regional mix/Hinglish).

Spoken Text: "${spokenText}"

Your Mission:
1. Detect the native language used by the citizen.
2. Generate a professional, concise 5-10 word Title in English summarizing the core problem.
3. Generate a comprehensive, clear Description in English detailing the problem, root cause, and citizen impact (preserving all factual details mentioned).
4. Identify the Civic Category strictly from: ["Water", "Roads", "Sanitation", "Health", "Agriculture", "Education", "Infrastructure", "Other"].
5. Estimate Urgency strictly from: ["High", "Medium", "Low"].
6. Extract Location Entities (State, District, Mandal/Tehsil, Village/Ward, specific Area/Landmark or Street) if mentioned by the citizen. If not mentioned, return empty string "".

Respond ONLY in valid JSON format:
{
  "detectedLanguage": "string (e.g. Telugu, Hindi, Tamil, English, etc.)",
  "transcribedText": "${spokenText.replace(/"/g, '\\"')}",
  "title": "string (in English)",
  "description": "string (in English)",
  "category": "string",
  "urgency": "string",
  "state": "string",
  "district": "string",
  "mandal": "string",
  "village": "string",
  "areaName": "string"
}
Respond strictly with valid JSON only, no markdown backticks, no other text.`;

  try {
    const { content } = await runGroqCompletion([
      { role: 'system', content: 'You are an AI civic intake processor. Return strictly valid JSON.' },
      { role: 'user', content: prompt }
    ], 500);

    const parsed = parseJsonFromResponse(content);
    if (!parsed) throw new Error("Could not parse JSON from voice structuring model");

    return {
      success: true,
      data: {
        detectedLanguage: parsed.detectedLanguage || 'Identified Regional Dialect',
        transcribedText: spokenText,
        title: parsed.title || spokenText.slice(0, 60),
        description: parsed.description || spokenText,
        category: parsed.category || 'Other',
        urgency: parsed.urgency || 'Medium',
        state: parsed.state || '',
        district: parsed.district || '',
        mandal: parsed.mandal || '',
        village: parsed.village || '',
        areaName: parsed.areaName || ''
      }
    };
  } catch (err) {
    console.error('[VOICE INTAKE] LLM structuring failed:', err.message);
    // Fallback: return raw text as description
    return {
      success: true,
      data: {
        detectedLanguage: 'Voice Input',
        transcribedText: spokenText,
        title: spokenText.slice(0, 60),
        description: spokenText,
        category: 'Other',
        urgency: 'Medium',
        state: '',
        district: '',
        mandal: '',
        village: '',
        areaName: ''
      }
    };
  }
}

module.exports = {
  processVoiceAudio,
  structureSpokenGrievance
};
