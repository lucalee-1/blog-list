const config = require('./utils/config');
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const app = express();
const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login')
const { errorHandler, unknownEndpoint, getTokenFrom  } = require('./utils/middleware');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error.message);
  }
};
connectDB();

app.use(cors());
app.use(express.json());
app.use(getTokenFrom)

app.get('/', (req, res) => {
  res.send(`<p>Supported routes are: /api/blogs, /api/users, /api/login </p>`)
});

app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
