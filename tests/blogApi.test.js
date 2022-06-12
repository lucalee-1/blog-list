const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./testHelper');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blog');

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

afterAll(async () => {
  await mongoose.connection.close();
});

test('blogs are returned as json', async () => {
  const res = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all blogs are returned', async () => {
  const res = await api.get('/api/blogs');
  expect(res.body).toHaveLength(helper.initialBlogs.length);
});

test('id is returned for each blog', async () => {
  const res = await api.get('/api/blogs');
  res.body.forEach((blog) => expect(blog.id).toBeDefined());
});
