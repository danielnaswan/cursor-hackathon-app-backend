/**
 * Intake Tests
 * @description Test suite for intake logging endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/user.model');
const Intake = require('../models/intake.model');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Intake.deleteMany({});
  
  testUser = await User.create({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  });
  
  authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'test-secret');
});

describe('Intake Endpoints', () => {
  describe('POST /api/intake/log', () => {
    it('should log a new intake', async () => {
      const res = await request(app)
        .post('/api/intake/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          puffs: 3,
          intensity: 'medium',
          context: 'stress',
          notes: 'After meeting'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.intake.puffs).toBe(3);
      expect(res.body.intake.intensity).toBe('medium');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/intake/log')
        .send({
          puffs: 3,
          intensity: 'medium',
          context: 'stress'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/intake/user/:id', () => {
    beforeEach(async () => {
      await Intake.create([
        { userId: testUser._id, puffs: 2, intensity: 'low', context: 'habit' },
        { userId: testUser._id, puffs: 4, intensity: 'high', context: 'stress' }
      ]);
    });

    it('should get user intakes', async () => {
      const res = await request(app)
        .get(`/api/intake/user/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intakes.length).toBe(2);
    });
  });

  describe('DELETE /api/intake/:logId', () => {
    let testIntake;

    beforeEach(async () => {
      testIntake = await Intake.create({
        userId: testUser._id,
        puffs: 2,
        intensity: 'low',
        context: 'habit'
      });
    });

    it('should delete an intake', async () => {
      const res = await request(app)
        .delete(`/api/intake/${testIntake._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

