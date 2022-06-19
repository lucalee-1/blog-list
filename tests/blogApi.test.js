const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const helper = require('./testHelper');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');

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
  const loginHelper = async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'default', passwordHash });
    await user.save();

    const loginData = {
      username: 'default',
      password: 'sekret'
    };

     const res = await api.post('/api/login').send(loginData);
     console.log('BODY',res.body);
     return token = res.body.token
  };
  test('a blog can be added', async () => {
    const token = await loginHelper()
    console.log("This IS TOKEN", token)
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

    console.log("CREATED BLOG", createdBlog.body)

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
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
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('update of a blog entry', () => {
  test('a blog can be updated', async () => {
    const update = {
      title: 'React patterns 2.0',
      author: 'Mark Chan',
      url: 'https://updatedreactpatterns.com/',
      likes: 8,
    };

    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedBlog = await api.put(`/api/blogs/${blogToUpdate.id}`).send(update).expect(200);
    expect(updatedBlog.body.id).toBe(blogToUpdate.id);

    const blogsAtEnd = await helper.blogsInDb();
    titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain(update.title);
  });
  test('extra properties are not added', async () => {
    const update = {
      title: 'React patterns 2.0',
      author: 'Mark Chan',
      url: 'https://updatedreactpatterns.com/',
      likes: 8,
      extraField: 'extra',
    };

    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    await api.put(`/api/blogs/${blogToUpdate.id}`).send(update).expect(200);

    const blogsAtEnd = await helper.blogsInDb();
    blogsAtEnd.forEach((blog) => expect(blog).not.toHaveProperty('extraField'));
  });
});

describe('deletion of a blog entry', () => {
  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1);

    const title = blogsAtEnd.map((r) => r.title);
    expect(title).not.toContain(blogToDelete.title);
  });
});
