const blogsRouter = require('express').Router();
const { userExtractor  } = require('../utils/middleware');
const Blog = require('../models/blog');
const User = require('../models/user');

blogsRouter.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 });
    res.json(blogs);
  } catch (error) {
    next(error);
  }
});

blogsRouter.post('/', userExtractor, async (req, res, next) => {
  try {   
    const user = await User.findById(req.user.id);

    console.log('User', user)

    const blog = new Blog({
      title: req.body.title,
      author: req.body.author,
      url: req.body.url,
      likes: req.body.likes || '0',
      user: user._id,
    });

    const savedBlog = await blog.save();
    console.log(savedBlog)
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    next(error);
  }
});

blogsRouter.get('/:id', async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('user', { username: 1, name: 1, id: 1 });
    if (!blog) {
      return res.status(404).end();
    }
    res.json(blog);
  } catch (error) {
    next(error);
  }
});

blogsRouter.put('/:id', userExtractor, async (req, res, next) => {
  const blogContent = {   
    likes: req.body.likes,
  };
  try {   
    // const blog = await Blog.findById(req.params.id);
    // if (!blog) {
    //   return res.status(404).end();
    // }
    // if (blog.user.toString() !== req.user.id) {
    //   return res
    //     .status(401)
    //     .json({ error: 'wrong user, only the original creator can edit a blog' });
    // }
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blogContent, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    res.json(updatedBlog);
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete('/:id', userExtractor, async (req, res, next) => {
  try {    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(204).end();
    }
    if (blog.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ error: 'wrong user, only the original creator can delete a blog' });
    }
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = blogsRouter;
