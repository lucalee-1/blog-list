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

const favoriteBlog = (blogs) => {
  const mostLikes = blogs.reduce(
    (previousLargest, blog) => Math.max(previousLargest, blog.likes),
    0
  );
  return blogs.filter((blog) => blog.likes === mostLikes)[0];
};

const mostBlogs = (blogs) => {
  if (!Array.isArray(blogs) || !blogs.length) {
    return null;
  }
  const counts = blogs.reduce((sum, blog) => {
    sum[blog.author] = (sum[blog.author] || 0) + 1;
    return sum;
  }, {});
  const maxCount = Math.max(...Object.values(counts));
  const topAuthor = Object.keys(counts).filter((k) => counts[k] === maxCount);
  return { author: topAuthor[0], blogs: maxCount };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
};
