const blog = require('../models/blog');

const dummy = (blogs) => {
  if (!Array.isArray(blogs)) {
    return false;
  }
  return blogs.length === 0 ? 1 : blogs.length / blogs.length;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

module.exports = {
  dummy,
  totalLikes,
};
