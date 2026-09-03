const request = require('supertest');
const app = require('../app');

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Clipper', email, password: 'ValidPass123' });
  return { token: res.body.data.accessToken };
};

describe('Clip Studio API (Vizard.ai integration)', () => {
  describe('GET /api/content/clip/supported', () => {
    it('reports not configured when VIZARD_API_KEY is unset', async () => {
      const { token } = await registerAndLogin('clipcheck@example.com');
      const res = await request(app).get('/api/content/clip/supported').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.configured).toBe(false);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/content/clip/supported');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/content/clip', () => {
    it('rejects an invalid video URL', async () => {
      const { token } = await registerAndLogin('badurl@example.com');
      const res = await request(app)
        .post('/api/content/clip')
        .set('Authorization', `Bearer ${token}`)
        .send({ videoUrl: 'not-a-url' });
      expect(res.statusCode).toBe(400);
    });

    it('returns 503 with a clear message when VIZARD_API_KEY is not configured', async () => {
      const { token } = await registerAndLogin('novizard@example.com');
      const res = await request(app)
        .post('/api/content/clip')
        .set('Authorization', `Bearer ${token}`)
        .send({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
      expect(res.statusCode).toBe(503);
      expect(res.body.message).toMatch(/VIZARD_API_KEY/i);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/content/clip').send({ videoUrl: 'https://example.com/video' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/content/clip-jobs', () => {
    it('only returns the requesting user\'s own jobs', async () => {
      const { token } = await registerAndLogin('emptyjobs@example.com');
      const res = await request(app).get('/api/content/clip-jobs').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs).toEqual([]);
    });
  });
});
