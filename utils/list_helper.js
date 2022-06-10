const dummy = (blogs) => {
  if (!Array.isArray(blogs)) {
    return false;
  }
  return blogs.length === 0 ? 1 : blogs.length / blogs.length;
};

module.exports = {
  dummy,
};
