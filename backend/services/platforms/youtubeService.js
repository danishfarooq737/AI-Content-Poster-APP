const axios = require('axios');
const logger = require('../../utils/logger');

// Reference: https://developers.google.com/identity/protocols/oauth2/web-server
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'openid',
      'email',
      'profile',
    ].join(' '),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code) => {
  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
};

const refreshAccessToken = async (refreshToken) => {
  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return { accessToken: data.access_token, expiresIn: data.expires_in };
};

// Uploading needs a hosted video file (videoAsset.url, e.g. a Vizard clip
// URL) whose bytes we fetch and stream into YouTube's resumable upload
// session, and a Google-verified app for public (non-testing-mode) use.
const publishVideo = async ({ accessToken, videoUrl, title, description, tags = [] }) => {
  if (!videoUrl) {
    const err = new Error('No rendered video is available for this content yet.');
    err.statusCode = 422;
    throw err;
  }
  try {
    // Step 1: fetch the source video as a stream (from Vizard's hosted URL)
    // so we never have to buffer the whole file in memory.
    const source = await axios.get(videoUrl, { responseType: 'stream', timeout: 30000 });
    const contentType = source.headers['content-type'] || 'video/mp4';
    const contentLength = source.headers['content-length'];

    // Step 2: initiate the resumable upload session with YouTube.
    const initRes = await axios.post(
      UPLOAD_URL,
      { snippet: { title, description, tags }, status: { privacyStatus: 'private' } },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': contentType,
          ...(contentLength ? { 'X-Upload-Content-Length': contentLength } : {}),
        },
      }
    );
    const uploadSessionUrl = initRes.headers.location;
    if (!uploadSessionUrl) throw new Error('YouTube did not return an upload session URL.');

    // Step 3: stream those bytes straight through to YouTube's session URL.
    const uploadRes = await axios.put(uploadSessionUrl, source.data, {
      headers: {
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    const uploadedId = uploadRes.data?.id;
    return {
      externalPostId: uploadedId || null,
      externalPostUrl: uploadedId ? `https://www.youtube.com/watch?v=${uploadedId}` : null,
    };
  } catch (err) {
    logger.error(`YouTube upload failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    throw new Error(
      'YouTube upload failed. Check OAuth consent screen verification status and that the source video URL is reachable.'
    );
  }
};

module.exports = { getAuthUrl, exchangeCodeForToken, refreshAccessToken, publishVideo };
