const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Content = require('../models/Content');
const Platform = require('../models/Platform');
const platformService = require('./platformService');
const encryptionService = require('./encryptionService');
const { pollClipJobs } = require('./clipPollerService');
const logger = require('../utils/logger');

const MAX_ATTEMPTS = 3;

// Selects exactly the fields each platform's adapter needs from the content's
// auto-generated platformMeta - this is what makes each platform "work
// differently": TikTok/Instagram get a single caption, YouTube gets a
// title + description + a real tags[] array. Falls back to generic
// title/hashtags if platformMeta wasn't populated for some reason (e.g.
// older content created before this field existed).
const buildPublishPayload = (platform, content, accessToken) => {
  const base = { accessToken, videoUrl: content.videoAsset?.url };
  const fallbackHashtagText = (content.hashtags || []).map((h) => `#${h}`).join(' ');

  if (platform.provider === 'tiktok') {
    return {
      ...base,
      caption: content.platformMeta?.tiktok?.caption || [content.title, fallbackHashtagText].filter(Boolean).join(' '),
    };
  }

  if (platform.provider === 'youtube') {
    return {
      ...base,
      title: content.platformMeta?.youtube?.title || content.title,
      description: content.platformMeta?.youtube?.description || fallbackHashtagText,
      tags: content.platformMeta?.youtube?.tags?.length ? content.platformMeta.youtube.tags : content.hashtags || [],
    };
  }

  if (platform.provider === 'instagram') {
    return {
      ...base,
      igUserId: platform.providerAccountId,
      caption:
        content.platformMeta?.instagram?.caption || [content.title, fallbackHashtagText].filter(Boolean).join('\n\n'),
    };
  }

  return base;
};

const processDueSchedules = async () => {
  const due = await Schedule.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
  }).limit(20);

  for (const schedule of due) {
    schedule.status = 'processing';
    schedule.attempts += 1;
    schedule.lastAttemptAt = new Date();
    await schedule.save();

    try {
      const content = await Content.findById(schedule.content);
      const platform = await Platform.findById(schedule.platform).select('+accessTokenEnc');

      if (!content || !platform) {
        throw new Error('Linked content or platform account no longer exists.');
      }

      const accessToken = encryptionService.decrypt(platform.accessTokenEnc);

      const payload = buildPublishPayload(platform, content, accessToken);
      const result = await platformService.publish(platform.provider, payload);

      schedule.status = 'posted';
      schedule.postedAt = new Date();
      schedule.externalPostId = result.externalPostId || null;
      schedule.externalPostUrl = result.externalPostUrl || null;
      await schedule.save();

      content.status = 'posted';
      await content.save();

      logger.info(`Schedule ${schedule._id} posted to ${platform.provider}.`);
    } catch (err) {
      schedule.status = schedule.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
      schedule.errorMessage = err.message;
      await schedule.save();
      logger.error(`Schedule ${schedule._id} failed (attempt ${schedule.attempts}): ${err.message}`);
    }
  }

  return due.length;
};

let task = null;

const startScheduler = () => {
  if (task) return task;
  // Runs every minute; each run only processes posts whose time has come.
  task = cron.schedule('* * * * *', async () => {
    try {
      const count = await processDueSchedules();
      if (count > 0) logger.info(`Scheduler processed ${count} due post(s).`);
    } catch (err) {
      logger.error(`Scheduler run failed: ${err.message}`);
    }
    try {
      await pollClipJobs();
    } catch (err) {
      logger.error(`Clip job polling failed: ${err.message}`);
    }
  });
  logger.info('Post scheduler + clip job poller started (runs every minute).');
  return task;
};

const stopScheduler = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

module.exports = { startScheduler, stopScheduler, processDueSchedules, buildPublishPayload };
