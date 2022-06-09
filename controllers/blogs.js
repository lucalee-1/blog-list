const blogsRouter = require('express').Router();
const Blog = require('../models/blog');

blogsRouter.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.json(blogs);
  } catch (error) {
    console.log(error);
  }
});

blogsRouter.post('/', async (req, res) => {
  try {
    const blog = new Blog(req.body);
    const result = await blog.save();
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
  }
});

module.exports = blogsRouter;
