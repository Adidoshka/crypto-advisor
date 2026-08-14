import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

// Must be set before app.ts's routes sign a JWT (the JWT_SECRET check itself lives in index.ts, deliberately not imported here).
process.env.JWT_SECRET = 'test-secret-for-vitest';

import app from '../../src/app';
import { User } from '../../src/models/User';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('registers a new user and never returns the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', name: 'Test User', password: 'longenoughpassword' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body).not.toHaveProperty('password');
  });

  it('rejects a malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', name: 'Test', password: 'longenoughpassword' });
    expect(res.status).toBe(400);
  });

  it('rejects a password under 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', name: 'Test', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email with 409, not 500', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', name: 'A', password: 'longenoughpassword' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', name: 'B', password: 'anotherlongpassword' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', name: 'Login Test', password: 'longenoughpassword' });
  });

  it('logs in with correct credentials and returns the real name', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'longenoughpassword' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Login Test');
  });

  it('rejects an incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});
