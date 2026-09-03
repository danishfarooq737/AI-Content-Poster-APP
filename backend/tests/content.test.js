const request = require('supertest');
const app = require('../app');
const Content = require('../models/Content');

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Creator', email, password: 'ValidPass123' });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id };
};

describe('Content API', () => {
  describe('Content CRUD & ownership', () => {
    it('only returns the requesting user\'s own content', async () => {
      const userA = await registerAndLogin('usera@example.com');
      const userB = await registerAndLogin('userb@example.com');

      await Content.create({ user: userA.userId, topic: 'User A private topic', status: 'draft' });
      await Content.create({ user: userB.userId, topic: 'User B private topic', status: 'draft' });

      const res = await request(app).get('/api/content').set('Authorization', `Bearer ${userA.token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].topic).toBe('User A private topic');
    });

    it('prevents a user from reading another user\'s content by id (IDOR protection)', async () => {
      const userA = await registerAndLogin('idor-a@example.com');
      const userB = await registerAndLogin('idor-b@example.com');

      const content = await Content.create({ user: userA.userId, topic: 'Private to user A', status: 'draft' });

      const res = await request(app)
        .get(`/api/content/${content._id}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(res.statusCode).toBe(404);
    });

    it('prevents a user from updating another user\'s content', async () => {
      const userA = await registerAndLogin('update-a@example.com');
      const userB = await registerAndLogin('update-b@example.com');

      const content = await Content.create({ user: userA.userId, topic: 'Owned by A', status: 'draft' });

      const res = await request(app)
        .put(`/api/content/${content._id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ title: 'Hijacked title' });
      expect(res.statusCode).toBe(404);

      const unchanged = await Content.findById(content._id);
      expect(unchanged.title).not.toBe('Hijacked title');
    });

    it('prevents a user from deleting another user\'s content', async () => {
      const userA = await registerAndLogin('delete-a@example.com');
      const userB = await registerAndLogin('delete-b@example.com');

      const content = await Content.create({ user: userA.userId, topic: 'Owned by A', status: 'draft' });

      const res = await request(app)
        .delete(`/api/content/${content._id}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(res.statusCode).toBe(404);

      const stillExists = await Content.findById(content._id);
      expect(stillExists).not.toBeNull();
    });

    it('allows the owner to update their own content', async () => {
      const userA = await registerAndLogin('owner-update@example.com');
      const content = await Content.create({ user: userA.userId, topic: 'Owned by A', status: 'draft' });

      const res = await request(app)
        .put(`/api/content/${content._id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ title: 'My new title' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.content.title).toBe('My new title');
    });

    it('lets the owner override the auto-generated per-platform captions', async () => {
      const userA = await registerAndLogin('meta-update@example.com');
      const content = await Content.create({
        user: userA.userId,
        topic: 'Clip from: https://example.com/video',
        status: 'ready',
        platformMeta: {
          tiktok: { caption: 'Original TikTok caption' },
          youtube: { title: 'Original', description: 'Original desc', tags: ['a', 'b'] },
          instagram: { caption: 'Original IG caption' },
        },
      });

      const res = await request(app)
        .put(`/api/content/${content._id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          platformMeta: {
            tiktok: { caption: 'Edited TikTok caption #test' },
            youtube: { title: 'Edited title', description: 'Edited desc', tags: ['x', 'y'] },
            instagram: { caption: 'Edited IG caption' },
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.content.platformMeta.tiktok.caption).toBe('Edited TikTok caption #test');
      expect(res.body.data.content.platformMeta.youtube.title).toBe('Edited title');
      expect(res.body.data.content.platformMeta.youtube.tags).toEqual(['x', 'y']);
      expect(res.body.data.content.platformMeta.instagram.caption).toBe('Edited IG caption');
    });
  });
});
