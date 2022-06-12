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

test('a blog can be added', async () => {
  const newBlog = {
    title: 'React is cool',
    author: 'Lee',
    url: 'https://reactiscool.com/',
    likes: 10,
  };
  const receivedBlog = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/);

  const blogsAtEnd = await api.get('/api/blogs');
  expect(blogsAtEnd.body).toHaveLength(helper.initialBlogs.length + 1);
  expect(blogsAtEnd.body).toContainEqual(receivedBlog.body);

  const titles = blogsAtEnd.body.map((blog) => blog.title);
  expect(titles).toContain(newBlog.title);
});

test('a missing likes property defaults to 0', async () => {
  const newBlog = {
    title: 'React is cool',
    author: 'Lee',
    url: 'https://reactiscool.com/',
  };

  const receivedBlog = await api.post('/api/blogs').send(newBlog);
  expect(receivedBlog.body.likes).toBe(0);
});

test('a blog missing title and url properties is not added', async () => {
  const newBlog = {
    author: 'Lee',
    likes: 10,
  };
  await api.post('/api/blogs').send(newBlog).expect(400);
  const blogsAtEnd = await api.get('/api/blogs');
  expect(blogsAtEnd.body).toHaveLength(helper.initialBlogs.length);
});
