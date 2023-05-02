import { comparePassword } from "../helpers/auth";
import { hashPassword } from "../helpers/auth";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

export const register = async (req, res) => {
  const { name, email, password, secret } = req.body;

  if (!name) {
    return res.json({
      error: "Name is requied",
    });
  }
  if (!password || password.length < 6)
    return res.json({
      error: "Password is required and should be 6 characters long",
    });

  if (!secret)
    return res.json({
      error: "Answer is requied",
    });

  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "Email is taken",
    });
  }

  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: nanoid(6),
  });
  try {
    await user.save();
    return res.json({
      ok: true,
    });
  } catch (err) {
    console.log("Register failer =>", err);
    return res.status(400).send("Error . Try again");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("No user found");

    //check password
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(400).send("Wrong password");

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error.Try again");
  }
};

export const currentUser = async (req, res) => {
  try {
    //console.log(req.auth);
    const user = await User.findById(req.auth._id);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

export const forgotPassword = async (req, res) => {
  const { email, newPassword, secret } = req.body;
  //validation
  if (!newPassword || newPassword.length < 6) {
    return res.json({
      error: "New password is required and should be 6 characters long",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret is required",
    });
  }

  const user = await User.findOne({ email, secret });
  if (!user) {
    return res.json({
      error: "No user found with these details",
    });
  }

  try {
    const hashed = await hashedPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "Congrats . You can login using your new password now",
    });
  } catch (err) {
    console.log("Error", err);
    return res.json({
      error: "Something went wrong.Try again.",
    });
  }
};

export const profileUpdate = async (req, res) => {
  try {
    const data = {};

    if (req.body.username) {
      data.username = req.body.username;
    }

    if (req.body.about) {
      data.about = req.body.about;
    }

    if (req.body.name) {
      data.name = req.body.name;
    }

    if (req.body.secret) {
      data.secret = req.body.secret;
    }

    if (req.body.image) {
      data.image = req.body.image;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error: "Password should be greater than equal to 6 characters",
        });
      } else data.password = await hashPassword(req.body.password);
    }

    let user = await User.findByIdAndUpdate(req.auth._id, data, { new: true });
    //console.log("Updated user");
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.json({
        error: "Duplicate username",
      });
    }
    console.log("err in update", err);
  }
};

export const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    //users following
    let following = user.following;

    //pushing current user as well in following
    following.push(req.auth._id);

    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    res.json(people);
  } catch (err) {
    console.log("Failed to get users");
  }
};

export const addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { follower: req.auth._id },
    });
    next();
  } catch (err) {
    console.log("Error in adding follower");
  }
};

export const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.auth._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log("Error in adding follower", err);
  }
};

export const userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    const following = await User.find({ _id: user.following }).limit(100);
    res.json(following);
  } catch (err) {
    console.log(" Error getting following list");
  }
};

//removeFollower, userUnfollow

export const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { follower: req.auth._id },
    });
    next();
  } catch (err) {
    console.log("Error unfollwing", err);
  }
};

export const userUnfollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.auth._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.log("Error unfollowing");
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password -secret"
    );
    res.json(user);
  } catch (err) {
    console.log("Error getting user", err);
  }
};
