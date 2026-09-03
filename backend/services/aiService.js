const axios = require('axios');
const logger = require('../utils/logger');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

/**
 * Given a clip's AI-suggested title and transcript (from Vizard), generates
 * one shared set of viral hashtags plus a YouTube-style description - then
 * the caller formats these differently per platform (see clipPollerService.js).
 *
 * This runs automatically when a clip finishes - the user never types a
 * caption. Requires AI_API_KEY (an Anthropic API key). If it's not
 * configured, or the call fails, the caller falls back to simple
 * title-only defaults rather than blocking the clip from becoming usable.
 */
const generatePlatformMetadata = async ({ clipTitle, transcript = '' }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    const err = new Error('AI_API_KEY is not configured.');
    err.statusCode = 503;
    throw err;
  }

  const systemPrompt =
    'You write viral short-form video metadata. Respond with ONLY valid JSON, no markdown fences, ' +
    'no commentary, matching this exact shape:\n' +
    '{\n' +
    '  "hashtags": string[8-12, no # symbol, no spaces within a tag],\n' +
    '  "youtubeDescription": string (2-4 engaging sentences describing the clip, written to hook a viewer, no hashtags included here)\n' +
    '}';

  const userPrompt =
    `Clip title: "${clipTitle}"\n` +
    (transcript ? `Transcript excerpt: "${transcript.slice(0, 1500)}"\n` : '') +
    'Generate hashtags and a YouTube description for this short-form video clip.';

  try {
    const response = await axios.post(
      ANTHROPIC_URL,
      {
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        timeout: 30000,
      }
    );

    const textBlock = (response.data.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('AI response contained no text content.');

    const cleaned = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    const parsed = JSON.parse(cleaned);

    return {
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((h) => String(h).replace(/^#/, '').replace(/\s+/g, '')).slice(0, 15)
        : [],
      youtubeDescription: parsed.youtubeDescription || '',
      model: MODEL,
    };
  } catch (err) {
    if (err.response) {
      logger.error(`Anthropic API error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    } else if (err instanceof SyntaxError) {
      logger.error(`Failed to parse AI JSON response: ${err.message}`);
    } else {
      logger.error(`AI service error: ${err.message}`);
    }
    throw err;
  }
};

/**
 * Builds the final per-platform posting content from a clip title + the
 * shared AI-generated hashtags/description. Runs synchronously, no network
 * call - the AI call above only needs to happen once per clip.
 */
const buildPlatformMeta = ({ clipTitle, hashtags = [], youtubeDescription = '' }) => {
  const hashtagText = hashtags.map((h) => `#${h}`).join(' ');

  return {
    tiktok: {
      caption: [clipTitle, hashtagText].filter(Boolean).join(' ').slice(0, 2200),
    },
    youtube: {
      title: clipTitle.slice(0, 100),
      description: [youtubeDescription, hashtagText].filter(Boolean).join('\n\n').slice(0, 5000),
      tags: hashtags.slice(0, 15),
    },
    instagram: {
      caption: [clipTitle, hashtagText].filter(Boolean).join('\n\n').slice(0, 2200),
    },
  };
};

module.exports = { generatePlatformMetadata, buildPlatformMeta };
