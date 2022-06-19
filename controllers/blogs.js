const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user');

const getTokenFrom = (req) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

blogsRouter.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 });
    res.json(blogs);
  } catch (error) {
    next(error);
  }
});

blogsRouter.post('/', async (req, res, next) => {
  try {
    const token = getTokenFrom(req);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' });
    }
    const user = await User.findById(decodedToken.id);

    const blog = new Blog({
      title: req.body.title,
      author: req.body.author,
      url: req.body.url,
      likes: req.body.likes || '0',
      user: user._id,
    });

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    next(error);
  }
});

blogsRouter.put('/:id', async (req, res, next) => {  
  const blogContent = {
    title: req.body.title,
    author: req.body.author,
    url: req.body.url,
    likes: req.body.likes || '0',
  };
  try {
    const token = getTokenFrom(req);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' });
    }
    const blog = await Blog.findById(req.params.id)
    if (blog.user.toString() !== decodedToken.id){
      return res.status(401).json({ error: 'wrong user, only the original creator can edit a blog' })
    }  
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blogContent, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    res.json(updatedBlog);
  } catch (error) {
    next(error)
  }
 
});

blogsRouter.delete('/:id', async (req, res, next) => {
  const token = getTokenFrom(req);
   
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' });
    }
    const blog = await Blog.findById(req.params.id)

    if (blog.user.toString() !== decodedToken.id){
      return res.status(401).json({ error: 'wrong user, only the original creator can delete a blog' })
    }  
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = blogsRouter;
