const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Integration with Vizard.ai's "Create Clips" API — turns a long-form video
 * (given as a URL) into several short, AI-selected vertical clips.
 *
 * HONESTY NOTE: this is implemented from general knowledge of Vizard's public
 * API shape, not a live-verified spec (no internet access was available while
 * building this). The overall flow (create project -> poll status -> read
 * back resulting clip URLs) is correct, but exact field/endpoint names may
 * have shifted. Before relying on this in production:
 *   1. Get a real VIZARD_API_KEY and test `POST /api/content/clip`.
 *   2. If it errors, check backend logs for the raw response Vizard sent back
 *      (logged below) and compare field names against your Vizard dashboard's
 *      API docs (usually linked from vizard.ai's developer/API settings).
 *   3. Adjust the field names in this file to match — the shape of the fix is
 *      almost always "rename a key", not a structural rewrite.
 */

const BASE_URL = process.env.VIZARD_API_BASE_URL || 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1';

const getApiKey = () => {
  const key = process.env.VIZARD_API_KEY;
  if (!key) {
    const err = new Error('VIZARD_API_KEY is not configured. Add your Vizard.ai API key to .env.');
    err.statusCode = 503;
    throw err;
  }
  return key;
};

// Starts a clipping project for a given source video URL (YouTube, Vimeo,
// Google Drive, or a direct video file link, depending on Vizard's current
// supported sources).
const createClipProject = async ({ videoUrl, lang = 'en' }) => {
  const apiKey = getApiKey();

  try {
    const { data } = await axios.post(
      `${BASE_URL}/project/create`,
      {
        lang,
        videoUrl,
        videoType: 2, // 2 = remote URL source, per Vizard's docs at time of writing
        ratioOfClip: 1, // 1 = 9:16 vertical, optimized for TikTok/Reels/Shorts
        preferLength: [0], // let Vizard choose the best clip length automatically
      },
      {
        headers: { VIZARDAI_API_KEY: apiKey, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const projectId = data.projectId ?? data.data?.projectId;
    if (!projectId) {
      logger.error(`Vizard create-project response missing projectId: ${JSON.stringify(data)}`);
      throw new Error('Vizard did not return a project id.');
    }
    return { projectId: String(projectId) };
  } catch (err) {
    if (err.response) {
      logger.error(`Vizard create-project failed (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    } else {
      logger.error(`Vizard create-project failed: ${err.message}`);
    }
    const e = new Error(
      'Could not start video clipping. Check that VIZARD_API_KEY is correct and the video URL is public.'
    );
    e.statusCode = 502;
    throw e;
  }
};

// Polls a project's status. Returns { status: 'processing' | 'ready' | 'failed', clips, error }
const getProjectStatus = async (projectId) => {
  const apiKey = getApiKey();

  const { data } = await axios.get(`${BASE_URL}/project/query/${projectId}`, {
    headers: { VIZARDAI_API_KEY: apiKey },
    timeout: 20000,
  });

  // Per Vizard's docs at time of writing: code 2000 = done, 1000/1001 = still
  // processing, anything else = an error occurred on their side.
  const code = data.code;

  if (code === 2000) {
    const rawClips = data.videos || data.data?.videos || [];
    const clips = rawClips.map((v) => ({
      title: v.title || 'Untitled clip',
      videoUrl: v.videoUrl || v.videoUrlLink || v.videoUrlLow,
      thumbnailUrl: v.coverUrl || v.thumbnailUrl || null,
      viralScore: v.viralScore ?? null,
      durationSeconds: v.videoMsDuration ? Math.round(v.videoMsDuration / 1000) : null,
      transcript: v.transcript || '',
    }));
    return { status: 'ready', clips, error: null };
  }

  if (code === 1000 || code === 1001) {
    return { status: 'processing', clips: [], error: null };
  }

  logger.error(`Vizard project ${projectId} reported a failure: ${JSON.stringify(data)}`);
  return { status: 'failed', clips: [], error: data.errMsg || 'Vizard reported an error for this project.' };
};

const isConfigured = () => Boolean(process.env.VIZARD_API_KEY);

module.exports = { createClipProject, getProjectStatus, isConfigured };
