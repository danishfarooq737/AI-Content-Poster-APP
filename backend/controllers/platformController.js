const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Platform = require('../models/Platform');
const platformService = require('../services/platformService');
const tiktokService = require('../services/platforms/tiktokService');
const encryptionService = require('../services/encryptionService');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

// State token binds the OAuth redirect back to the initiating user & provider,
// signed so it cannot be tampered with (CSRF protection for the OAuth flow).
// For providers that require PKCE (TikTok), the code_verifier travels here
// too, so it survives the redirect round-trip without server-side session
// storage - it's not a secret from TikTok itself (PKCE's whole point is that
// the verifier is sent to the token endpoint in plain text), so embedding it
// in a signed-but-unencrypted JWT is safe.
const buildState = (userId, provider, codeVerifier = null) =>
  jwt.sign(
    { userId, provider, codeVerifier, nonce: crypto.randomBytes(8).toString('hex') },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

// @desc List the caller's connected platform accounts
// @route GET /api/platforms
const listPlatforms = asyncHandler(async (req, res) => {
  const platforms = await Platform.find({ user: req.user._id });
  return sendSuccess(res, 200, 'Connected platforms', { platforms });
});

// @desc Which providers are configured server-side (have OAuth app credentials)
// @route GET /api/platforms/supported
const listSupported = asyncHandler(async (req, res) => {
  const providers = ['tiktok', 'youtube', 'instagram'].map((provider) => ({
    provider,
    configured: platformService.isProviderConfigured(provider),
  }));
  return sendSuccess(res, 200, 'Supported providers', { providers });
});

// @desc Start OAuth connect flow for a provider
// @route GET /api/platforms/:provider/connect
const connect = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  if (!platformService.isProviderConfigured(provider)) {
    throw new ApiError(
      503,
      `${provider} is not configured on this server. An admin must add ${provider.toUpperCase()} OAuth credentials to .env.`
    );
  }

  let codeVerifier = null;
  const extra = {};
  if (provider === 'tiktok') {
    const pkce = tiktokService.generatePkcePair();
    codeVerifier = pkce.verifier;
    extra.codeChallenge = pkce.challenge;
  }

  const state = buildState(req.user._id.toString(), provider, codeVerifier);
  const url = platformService.getAuthUrl(provider, state, extra);
  return sendSuccess(res, 200, 'Authorization URL generated', { url });
});

// @desc OAuth callback - exchanges code for tokens, stores the connection,
// then redirects the browser back to the frontend (this route is hit by a
// real browser redirect from the provider, not an API client).
// @route GET /api/platforms/:provider/callback
const callback = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;
  const frontendBase = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
  const redirectTo = (query) => res.redirect(`${frontendBase}/oauth/callback?${query}`);

  if (!code || !state) {
    return redirectTo(`error=${encodeURIComponent('Missing code or state from provider redirect.')}`);
  }

  let decodedState;
  try {
    decodedState = jwt.verify(state, process.env.JWT_SECRET);
  } catch (_) {
    return redirectTo(`error=${encodeURIComponent('Invalid or expired OAuth state. Please try connecting again.')}`);
  }
  if (decodedState.provider !== provider) {
    return redirectTo(`error=${encodeURIComponent('State/provider mismatch.')}`);
  }

  try {
    const tokenData = await platformService.exchangeCodeForToken(provider, code, decodedState.codeVerifier);

    await Platform.findOneAndUpdate(
      { user: decodedState.userId, provider, providerAccountId: tokenData.openId || `${provider}_${decodedState.userId}` },
      {
        user: decodedState.userId,
        provider,
        providerAccountId: tokenData.openId || `${provider}_${decodedState.userId}`,
        accessTokenEnc: encryptionService.encrypt(tokenData.accessToken),
        refreshTokenEnc: tokenData.refreshToken ? encryptionService.encrypt(tokenData.refreshToken) : null,
        tokenExpiresAt: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null,
        status: 'connected',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return redirectTo('success=true');
  } catch (err) {
    return redirectTo(`error=${encodeURIComponent('Could not complete the connection. Please try again.')}`);
  }
});

// @desc Disconnect a platform account (owner only)
// @route DELETE /api/platforms/:id
const disconnect = asyncHandler(async (req, res) => {
  const platform = await Platform.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!platform) throw new ApiError(404, 'Connected account not found.');
  return sendSuccess(res, 200, 'Platform disconnected');
});

module.exports = { listPlatforms, listSupported, connect, callback, disconnect };
