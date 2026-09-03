const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

const registerAndLogin = async (email, isFirstUser = false) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email, password: 'ValidPass123' });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id, role: res.body.data.user.role };
};

describe('Role-based authorization', () => {
  it('blocks a standard user from listing all users (admin-only route)', async () => {
    await registerAndLogin('admin1@example.com'); // becomes admin (first user)
    const standard = await registerAndLogin('standard@example.com'); // becomes user

    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${standard.token}`);
    expect(res.statusCode).toBe(403);
  });

  it('allows an admin to list all users', async () => {
    const admin = await registerAndLogin('admin2@example.com');
    await registerAndLogin('user2@example.com');

    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
  });

  it('blocks a standard user from changing another user\'s role', async () => {
    await registerAndLogin('admin3@example.com');
    const userA = await registerAndLogin('usera3@example.com');
    const userB = await registerAndLogin('userb3@example.com');

    const res = await request(app)
      .patch(`/api/users/${userB.userId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ role: 'admin' });
    expect(res.statusCode).toBe(403);
  });

  it('prevents an admin from demoting/deleting themselves', async () => {
    const admin = await registerAndLogin('admin4@example.com');

    const res = await request(app)
      .patch(`/api/users/${admin.userId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'user' });
    expect(res.statusCode).toBe(400);
  });
});

describe('User model validation', () => {
  it('rejects a user with an invalid email format', async () => {
    const user = new User({ name: 'Bad Email', email: 'not-an-email', password: 'ValidPass123' });
    await expect(user.validate()).rejects.toThrow();
  });

  it('rejects a user without a required field', async () => {
    const user = new User({ email: 'missing@example.com', password: 'ValidPass123' });
    await expect(user.validate()).rejects.toThrow();
  });

  it('enforces unique email at the database level', async () => {
    await User.create({ name: 'First', email: 'dup@example.com', password: 'ValidPass123' });
    await expect(User.create({ name: 'Second', email: 'dup@example.com', password: 'ValidPass123' })).rejects.toThrow();
  });
});
