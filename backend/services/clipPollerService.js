const ClipJob = require('../models/ClipJob');
const Content = require('../models/Content');
const vizardService = require('./vizardService');
const aiService = require('./aiService');
const logger = require('../utils/logger');

const MAX_ATTEMPTS = 40; // ~40 minutes at a 1-minute poll interval - clipping can take a while

// Builds the platform-specific title/caption/description/tags for one clip,
// automatically - no user input required. Falls back to a simple,
// hashtag-free version if AI_API_KEY isn't configured or the call fails, so
// a clip is never blocked from becoming usable.
const buildMetaForClip = async (clip) => {
  try {
    const ai = await aiService.generatePlatformMetadata({ clipTitle: clip.title, transcript: clip.transcript });
    return {
      hashtags: ai.hashtags,
      platformMeta: aiService.buildPlatformMeta({
        clipTitle: clip.title,
        hashtags: ai.hashtags,
        youtubeDescription: ai.youtubeDescription,
      }),
      aiModel: ai.model,
    };
  } catch (err) {
    logger.warn(`AI metadata generation skipped for clip "${clip.title}": ${err.message}`);
    return {
      hashtags: [],
      platformMeta: aiService.buildPlatformMeta({ clipTitle: clip.title, hashtags: [], youtubeDescription: '' }),
      aiModel: null,
    };
  }
};

const pollClipJobs = async () => {
  const pending = await ClipJob.find({ status: { $in: ['queued', 'processing'] } }).limit(10);
  let readyCount = 0;

  for (const job of pending) {
    job.attempts += 1;

    try {
      const result = await vizardService.getProjectStatus(job.externalProjectId);

      if (result.status === 'ready') {
        const contentDocs = [];
        for (const clip of result.clips) {
          const meta = await buildMetaForClip(clip);
          const doc = await Content.create({
            user: job.user,
            topic: `Clip from: ${job.sourceVideoUrl}`,
            title: clip.title,
            hashtags: meta.hashtags,
            platformMeta: meta.platformMeta,
            aiModel: meta.aiModel,
            status: 'ready',
            videoAsset: {
              status: 'ready',
              provider: 'vizard',
              externalJobId: job.externalProjectId,
              url: clip.videoUrl,
              thumbnailUrl: clip.thumbnailUrl,
              durationSeconds: clip.durationSeconds,
            },
          });
          contentDocs.push(doc);
        }

        job.status = 'ready';
        job.resultContentIds = contentDocs.map((d) => d._id);
        await job.save();
        readyCount += 1;
        logger.info(`Clip job ${job._id}: ${contentDocs.length} clip(s) ready, captions auto-generated per platform.`);
      } else if (result.status === 'failed') {
        job.status = 'failed';
        job.error = result.error;
        await job.save();
        logger.error(`Clip job ${job._id} failed: ${result.error}`);
      } else if (job.attempts >= MAX_ATTEMPTS) {
        job.status = 'failed';
        job.error = 'Timed out waiting for Vizard to finish clipping this video.';
        await job.save();
      } else {
        job.status = 'processing';
        await job.save();
      }
    } catch (err) {
      if (job.attempts >= MAX_ATTEMPTS) {
        job.status = 'failed';
      }
      job.error = err.message;
      await job.save();
      logger.error(`Clip job ${job._id} poll error: ${err.message}`);
    }
  }

  return readyCount;
};

module.exports = { pollClipJobs };
