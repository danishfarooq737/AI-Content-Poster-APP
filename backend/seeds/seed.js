/**
 * Seed script for local development/testing.
 * Usage:
 *   npm run seed          # seed the database (safe to re-run; clears first)
 *   npm run seed:clear    # only clear collections, no new data
 *
 * Does NOT contain real credentials or production data.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Content = require('../models/Content');
const Platform = require('../models/Platform');
const Schedule = require('../models/Schedule');
const encryptionService = require('../services/encryptionService');
const logger = require('../utils/logger');

const clearOnly = process.argv.includes('--clear');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to ${mongoose.connection.host} for seeding.`);

  await Promise.all([
    User.deleteMany({}),
    Content.deleteMany({}),
    Platform.deleteMany({}),
    Schedule.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  if (clearOnly) {
    console.log('Clear-only mode: skipping data creation.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // --- Users ---
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@viralpost.dev',
    password: 'AdminPass123',
    role: 'admin',
  });

  const creator = await User.create({
    name: 'Jordan Creator',
    email: 'creator@viralpost.dev',
    password: 'CreatorPass123',
    role: 'user',
  });

  const secondUser = await User.create({
    name: 'Sam Marketer',
    email: 'sam@viralpost.dev',
    password: 'SamPass123',
    role: 'user',
  });

  console.log('Created 3 users (1 admin, 2 standard).');

  // --- Sample connected platform (fake/dev tokens only - never real credentials) ---
  const platform = await Platform.create({
    user: creator._id,
    provider: 'tiktok',
    providerAccountId: 'dev_tiktok_account_001',
    displayName: '@jordan.creates',
    accessTokenEnc: encryptionService.encrypt('dev-placeholder-access-token'),
    refreshTokenEnc: encryptionService.encrypt('dev-placeholder-refresh-token'),
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    scopes: ['user.info.basic', 'video.publish'],
    status: 'connected',
  });

  console.log('Created 1 sample connected platform account.');

  // --- Sample content ---
  const contentSamples = [
    {
      user: creator._id,
      topic: '5 morning habits that changed my productivity',
      title: '5 Morning Habits That Changed Everything',
      script: '[0-3s HOOK] I used to hit snooze 6 times... [3-15s] Here is what changed...',
      caption: 'The habits nobody talks about 👇',
      hashtags: ['productivity', 'morningroutine', 'selfimprovement', 'motivation'],
      hookIdeas: ['I used to hit snooze 6 times a day, then I tried this...', 'This 5-minute habit changed my life'],
      aiModel: 'claude-sonnet-4-6',
      status: 'ready',
    },
    {
      user: creator._id,
      topic: 'Budget meal prep for busy weeks',
      title: 'Meal Prep on a $30 Budget',
      script: '[0-3s HOOK] $30, 5 days of meals, watch this... [3-20s] Ingredient breakdown...',
      caption: '$30 for a whole week of food 🍱',
      hashtags: ['mealprep', 'budgetcooking', 'foodtok', 'recipe'],
      hookIdeas: ['$30 fed me for a whole week, here is how'],
      aiModel: 'claude-sonnet-4-6',
      status: 'draft',
    },
    {
      user: secondUser._id,
      topic: 'Quick desk stretches for remote workers',
      title: '3 Desk Stretches Your Back Will Thank You For',
      script: '[0-3s HOOK] Stop scrolling if your back hurts right now... [3-18s] Stretch 1...',
      caption: 'Do this every 90 minutes 🙌',
      hashtags: ['deskexercise', 'remotework', 'backpain', 'wellness'],
      hookIdeas: ['Stop scrolling if your back hurts right now'],
      aiModel: 'claude-sonnet-4-6',
      status: 'ready',
    },
  ];

  const contents = await Content.insertMany(contentSamples);
  console.log(`Created ${contents.length} sample content items.`);

  // --- Sample schedule (future date, pending) ---
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);

  await Schedule.create({
    user: creator._id,
    content: contents[0]._id,
    platform: platform._id,
    scheduledFor: futureDate,
    status: 'pending',
  });

  console.log('Created 1 sample scheduled post.');

  console.log('\nSeed complete. Sample login credentials (development only):');
  console.log('  Admin:   admin@viralpost.dev   / AdminPass123');
  console.log('  Creator: creator@viralpost.dev / CreatorPass123');
  console.log('  User:    sam@viralpost.dev     / SamPass123');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
