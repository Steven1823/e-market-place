import express from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { isAuth, generateToken } from '../utils.js';
import data from '../data.js';

const userRouter = express.Router();
const fallbackUsers = data.users.map((user, index) => ({
  ...user,
  _id: user._id || `u${index + 1}`,
}));

userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    let user = null;
    try {
      user = await User.findOne({ email: req.body.email });
    } catch (err) {
      user = fallbackUsers.find((u) => u.email === req.body.email);
    }
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    let user;
    try {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
      });
      user = await newUser.save();
    } catch (err) {
      user = {
        _id: `u${Date.now()}`,
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
        isAdmin: false,
      };
      fallbackUsers.push(user);
    }
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    let user;
    let usingFallback = false;
    try {
      user = await User.findById(req.user._id);
    } catch (err) {
      usingFallback = true;
      user = fallbackUsers.find((u) => String(u._id) === String(req.user._id));
    }

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      const updatedUser = usingFallback ? user : await user.save();
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser),
      });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

export default userRouter;
