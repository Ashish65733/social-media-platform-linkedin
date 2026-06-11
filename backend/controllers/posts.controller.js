import Post from "../models/posts.model.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comments.model.js";

import bycrypt from "bcrypt";

export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "RUNNING" });
};

export const createPost = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const newPost = new Post({
      userId: user._id,
      body: req.body.body,
      media: req.file != undefined ? req.file.filename : "",
      fileType: req.file != undefined ? req.file.mimetype.split("/")[1] : "",
    });

    await newPost.save();

    return res.status(200).json({ message: "Post created successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "userId",
      "name username email profilePicture",
    );

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { token, post_id } = req.body;

    const user = await User.findOne({ token: token });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const post = await Post.findOne({ _id: post_id });

    if (!post) return res.status(404).json({ message: "Post not found!" });

    if (post.userId.toString() !== user._id.toString()) {
      return res.status(401).json({ message: "User is Unauthorized" });
    }

    await Post.deleteOne({ _id: post_id });

    return res.json({ message: "Post deleted successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { token, post_id, commentBody } = req.body;

    const user = await User.findOne({ token: token }).select("_id");
    if (!user) return res.status(404).json({ message: "User not found!" });

    const post = await Post.findOne({ _id: post_id });

    if (!post) return res.status(404).json({ message: "Post not found!" });

    const comment = new Comment({
      userId: user._id,
      postId: post_id,
      body: commentBody,
    });

    await comment.save();

    return res.status(200).json({ message: "Comment added!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllCommentsByPost = async (req, res) => {
  try {
    const { post_id } = req.body;

    const post = await Post.findOne({ _id: post_id });

    if (!post) return res.status(404).json({ message: "Post not found!" });

    const comments = await Comment.find({ postId: post_id }).populate(
      "userId",
      "name username email profilePicture",
    );

    return res.json({ comments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { token, comment_id } = req.body;
    const user = await User.findOne({ token: token }).select("_id");

    if (!user) return res.status(404).json({ message: "User not found!" });

    const comment = await Comment.findOne({ _id: comment_id });

    if (!comment)
      return res.status(404).json({ message: "Comment not found!" });

    if (comment.userId.toString() !== user._id.toString()) {
      return res.status(401).json({ message: "User is Unauthorized" });
    }

    await Comment.deleteOne({ _id: comment_id });

    return res.json({ message: "Comment deleted successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const incrementLikes = async (req, res) => {
  try {
    const { post_id } = req.body;

    const post = await Post.findOne({ _id: post_id });

    if (!post) return res.status(404).json({ message: "Post not found!" });

    post.likes += 1;

    await post.save();
    return res.json({ message: "Likes incremented!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
