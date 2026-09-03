const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../utils/logger');

// Reference: https://developers.tiktok.com/doc/login-kit-web
const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const POST_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

// TikTok's v2 OAuth requires PKCE (this is what the "code_challenge" error
// means - TikTok rejected the request because no code_challenge was sent).
// We generate a fresh verifier/challenge pair per connect attempt; the
// verifier travels inside the signed `state` JWT (see platformController.js)
// so it survives the redirect round-trip without needing server-side session
// storage.
const generatePkcePair = () => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
};

const getAuthUrl = (state, codeChallenge) => {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic,video.publish,video.upload',
    response_type: 'code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code, codeVerifier) => {
  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    openId: data.open_id,
  };
};

// Publishing requires an approved TikTok app with the video.publish scope
// AND a publicly reachable, hosted video file URL (videoAsset.url).
// Publishing requires an approved TikTok app with the video.publish scope.
// PULL_FROM_URL tells TikTok to fetch the video itself from video_url (no
// byte-streaming needed on our end, unlike YouTube) - Vizard's clip URLs
// work well for this. One thing worth knowing: TikTok has, at various
// points, required the source domain to be verified in your app's settings
// before PULL_FROM_URL succeeds for that domain. If this call fails with a
// domain/URL-related error, check your TikTok app dashboard for a domain
// verification step and add Vizard's video-hosting domain there.
const publishVideo = async ({ accessToken, videoUrl, caption }) => {
  if (!videoUrl) {
    const err = new Error('No rendered video is available for this content yet.');
    err.statusCode = 422;
    throw err;
  }
  try {
    const { data } = await axios.post(
      POST_INIT_URL,
      {
        post_info: { title: caption, privacy_level: 'SELF_ONLY', disable_duet: false },
        source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { externalPostId: data?.data?.publish_id, externalPostUrl: null };
  } catch (err) {
    logger.error(`TikTok publish failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    throw new Error('TikTok publish failed. Check app approval status and video URL accessibility.');
  }
};

module.exports = { getAuthUrl, exchangeCodeForToken, publishVideo, generatePkcePair };
