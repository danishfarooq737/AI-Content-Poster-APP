const axios = require('axios');
const logger = require('../../utils/logger');

// Reference: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login
const AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list',
    response_type: 'code',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code) => {
  const { data } = await axios.get(TOKEN_URL, {
    params: {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    },
  });
  return { accessToken: data.access_token, expiresIn: data.expires_in };
};

// Publishing to Instagram Reels is a two-step process: create a media
// container from a hosted video URL, then publish the container.
const publishVideo = async ({ accessToken, igUserId, videoUrl, caption }) => {
  if (!videoUrl) {
    const err = new Error('No rendered video is available for this content yet.');
    err.statusCode = 422;
    throw err;
  }
  try {
    const createRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media`, {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    });
    const creationId = createRes.data.id;

    const publishRes = await axios.post(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });

    return { externalPostId: publishRes.data.id, externalPostUrl: null };
  } catch (err) {
    logger.error(`Instagram publish failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    throw new Error('Instagram publish failed. Check app review status for instagram_content_publish.');
  }
};

module.exports = { getAuthUrl, exchangeCodeForToken, publishVideo };
