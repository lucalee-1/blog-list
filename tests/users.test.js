const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const supertest = require('supertest');
const helper = require('./testHelper');
const app = require('../app');

const api = supertest(app);

const User = require('../models/user');

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);
  const user = new User({ username: 'default', passwordHash });

  await user.save();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('cretion of a new user', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'user1',
      name: 'User1',
      password: 'user1password',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });
  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'default',
      name: 'Superuser',
      password: 'secret1',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('username must be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
  test('creation fails with proper statuscode and message if username or password are missing', async () => {
    const usersAtStart = await helper.usersInDb();

    const missingUsername = {
      name: 'User1',
      password: 'user1password',
    };

    const result1 = await api
      .post('/api/users')
      .send(missingUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result1.body.error).toContain('password and username are required');

    const missingPw = {
      username: 'user1',
      name: 'User1',
    };

    const result2 = await api
      .post('/api/users')
      .send(missingPw)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result2.body.error).toContain('password and username are required');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
  test('creation fails with proper statuscode and message if username or password are shorter than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb();

    const shortUsername = {
      username: 'us',
      name: 'User1',
      password: 'user1password',
    };

    const result1 = await api
      .post('/api/users')
      .send(shortUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result1.body.error).toContain(
      'password and username must each be at least 3 characters long'
    );

    const shortPw = {
      username: 'user1',
      name: 'User1',
      password: 'us',
    };

    const result2 = await api
      .post('/api/users')
      .send(shortPw)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result2.body.error).toContain(
      'password and username must each be at least 3 characters long'
    );

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
});
