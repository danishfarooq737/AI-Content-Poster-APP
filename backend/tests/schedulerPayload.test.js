const { buildPublishPayload } = require('../services/schedulerService');

describe('buildPublishPayload (per-platform posting content)', () => {
  const baseContent = {
    title: 'Fallback Title',
    hashtags: ['fallback1', 'fallback2'],
    videoAsset: { url: 'https://cdn.example.com/clip.mp4' },
    platformMeta: {
      tiktok: { caption: 'TikTok caption with #hashtags' },
      youtube: { title: 'YT Title', description: 'YT description', tags: ['tag1', 'tag2'] },
      instagram: { caption: 'Instagram caption with #hashtags' },
    },
  };

  it('sends only a caption for TikTok - no title/description/tags fields', () => {
    const payload = buildPublishPayload({ provider: 'tiktok' }, baseContent, 'token123');
    expect(payload.caption).toBe('TikTok caption with #hashtags');
    expect(payload.title).toBeUndefined();
    expect(payload.description).toBeUndefined();
    expect(payload.tags).toBeUndefined();
    expect(payload.videoUrl).toBe('https://cdn.example.com/clip.mp4');
  });

  it('sends title + description + a real tags array for YouTube', () => {
    const payload = buildPublishPayload({ provider: 'youtube' }, baseContent, 'token123');
    expect(payload.title).toBe('YT Title');
    expect(payload.description).toBe('YT description');
    expect(payload.tags).toEqual(['tag1', 'tag2']);
    expect(payload.caption).toBeUndefined();
  });

  it('sends only a caption for Instagram, plus the account id', () => {
    const payload = buildPublishPayload({ provider: 'instagram', providerAccountId: 'ig_123' }, baseContent, 'token123');
    expect(payload.caption).toBe('Instagram caption with #hashtags');
    expect(payload.igUserId).toBe('ig_123');
    expect(payload.title).toBeUndefined();
  });

  it('falls back to title + hashtags when platformMeta is missing (legacy content)', () => {
    const legacyContent = {
      title: 'Legacy Title',
      hashtags: ['old', 'tags'],
      videoAsset: { url: 'https://cdn.example.com/legacy.mp4' },
      platformMeta: {},
    };
    const tiktokPayload = buildPublishPayload({ provider: 'tiktok' }, legacyContent, 'token123');
    expect(tiktokPayload.caption).toBe('Legacy Title #old #tags');

    const youtubePayload = buildPublishPayload({ provider: 'youtube' }, legacyContent, 'token123');
    expect(youtubePayload.title).toBe('Legacy Title');
    expect(youtubePayload.tags).toEqual(['old', 'tags']);
  });
});
