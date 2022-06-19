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

describe('when there are initially some blogs saved', () => {
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
});

describe('creation of a new blog entry', () => {
  test('a blog can be added', async () => {
    const token = await helper.login();
    const newBlog = {
      title: 'React is cool',
      author: 'Lee',
      url: 'https://reactiscool.com/',
      likes: 10,
    };

    const createdBlog = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain(newBlog.title);
  });

  test('a missing likes property defaults to 0', async () => {
    const token = await helper.login();
    const newBlog = {
      title: 'React is cool',
      author: 'Lee',
      url: 'https://reactiscool.com/',
    };

    const receivedBlog = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog);
    expect(receivedBlog.body.likes).toBe(0);
  });

  test('a blog missing title and url properties is not added', async () => {
    const token = await helper.login();
    const newBlog = {
      author: 'Lee',
      likes: 10,
    };
    await api.post('/api/blogs').send(newBlog).set('Authorization', `bearer ${token}`).expect(400);
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
  test('will fail if valid token not provided', async () => {
    const token = await helper.login();
    const newBlog = {
      title: 'React is cool',
      author: 'Lee',
      url: 'https://reactiscool.com/',
      likes: 10,
    };
    await api.post('/api/blogs').send(newBlog).set('Authorization', 'bearer 12345').expect(401);
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('update of a blog entry', () => {
  test('a blog can be updated', async () => {
    const token = await helper.login();
    const blogId = await helper.createBlogWithId(token);
    const update = {
      title: 'React patterns 2.0',
      author: 'Mark Chan',
      url: 'https://updatedreactpatterns.com/',
      likes: 8,
    };

    const blogsAtStart = await helper.blogsInDb();

    const updatedBlog = await api
      .put(`/api/blogs/${blogId}`)
      .set('Authorization', `bearer ${token}`)
      .send(update)
      .expect(200);
    expect(updatedBlog.body.id).toBe(blogId);

    const blogsAtEnd = await helper.blogsInDb();
    titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain(update.title);
  });
  test('extra properties are not added', async () => {
    const token = await helper.login();
    const blogId = await helper.createBlogWithId(token);
    const update = {
      title: 'React patterns 2.0',
      author: 'Mark Chan',
      url: 'https://updatedreactpatterns.com/',
      likes: 8,
      extraField: 'extra',
    };

    const blogsAtStart = await helper.blogsInDb();

    await api
      .put(`/api/blogs/${blogId}`)
      .set('Authorization', `bearer ${token}`)
      .send(update)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();
    blogsAtEnd.forEach((blog) => expect(blog).not.toHaveProperty('extraField'));
  });
  test('will fail if valid token not provided', async () => {
    const token = await helper.login();
    const blogId = await helper.createBlogWithId(token);
    const update = {
      title: 'React patterns 2.0',
      author: 'Mark Chan',
      url: 'https://updatedreactpatterns.com/',
      likes: 8,
      extraField: 'extra',
    };

    await api
      .put(`/api/blogs/${blogId}`)
      .set('Authorization', 'bearer 12345')
      .send(update)
      .expect(401);

    const blogsAtEnd = await helper.blogsInDb();
    titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).not.toContain(update.title);
  });
});

describe('deletion of a blog entry', () => {
  test('a blog can be deleted', async () => {
    const token = await helper.login();
    const blogId = await helper.createBlogWithId(token);
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart.at(-1);

    await api.delete(`/api/blogs/${blogId}`).set('Authorization', `bearer ${token}`).expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1);

    const title = blogsAtEnd.map((r) => r.title);
    expect(title).not.toContain(blogToDelete.title);
  });
  test('will fail if valid token not provided', async () => {
    const token = await helper.login();
    const blogId = await helper.createBlogWithId(token);
    const blogsAtStart = await helper.blogsInDb();

    await api.delete(`/api/blogs/${blogId}`).set('Authorization', 'bearer 12345').expect(401);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length);
  });
});
