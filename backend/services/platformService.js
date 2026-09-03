const tiktok = require('./platforms/tiktokService');
const youtube = require('./platforms/youtubeService');
const instagram = require('./platforms/instagramService');

const adapters = { tiktok, youtube, instagram };

const getAdapter = (provider) => {
  const adapter = adapters[provider];
  if (!adapter) {
    const err = new Error(`Unsupported platform: ${provider}`);
    err.statusCode = 400;
    throw err;
  }
  return adapter;
};

const getAuthUrl = (provider, state, extra = {}) => getAdapter(provider).getAuthUrl(state, extra.codeChallenge);

const exchangeCodeForToken = (provider, code, codeVerifier) => getAdapter(provider).exchangeCodeForToken(code, codeVerifier);

const publish = (provider, payload) => getAdapter(provider).publishVideo(payload);

const REQUIRED_ENV_BY_PROVIDER = {
  tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI'],
  youtube: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
  instagram: ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET', 'INSTAGRAM_REDIRECT_URI'],
};

const isProviderConfigured = (provider) => {
  const keys = REQUIRED_ENV_BY_PROVIDER[provider] || [];
  return keys.every((k) => Boolean(process.env[k]));
};

module.exports = { getAuthUrl, exchangeCodeForToken, publish, isProviderConfigured, REQUIRED_ENV_BY_PROVIDER };
