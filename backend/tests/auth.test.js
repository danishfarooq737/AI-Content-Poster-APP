const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'ValidPass123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns an access token', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('makes the first registered user an admin', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('makes the second registered user a standard user', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'second@example.com' });
      expect(res.body.data.user.role).toBe('user');
    });

    it('rejects duplicate emails', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects a weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'weak@example.com', password: 'weak' });
      expect(res.statusCode).toBe(400);
    });

    it('never stores the password as plain text', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const stored = await User.findOne({ email: validUser.email }).select('+password');
      expect(stored.password).not.toBe(validUser.password);
      expect(stored.password.length).toBeGreaterThan(20);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects an incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword123' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects a non-existent email with the same generic message (no user enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'WhateverPass123' });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('rejects requests with a malformed token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
      expect(res.statusCode).toBe(401);
    });

    it('returns the current user with a valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(validUser);
      const token = registerRes.body.data.accessToken;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(validUser.email);
    });
  });
});
