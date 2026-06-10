import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ConnectionRequest from "../models/connections.model.js";

const convertUserDataToPDF = async (userData) => {
  const doc = new PDFDocument();

  const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";

  const fullPath = path.join("uploads", outputPath);
  const stream = fs.createWriteStream(fullPath);

  doc.pipe(stream);

  doc.image(`uploads/${userData.userId.profilePicture}`, {
    align: "center",
    width: 100,
  });

  doc.fontSize(14).text(`Name : ${userData.userId.name}`);
  doc.fontSize(14).text(`Username : ${userData.userId.username}`);
  doc.fontSize(14).text(`Email : ${userData.userId.email}`);
  doc.fontSize(14).text(`Bio : ${userData.bio}`);
  doc.fontSize(14).text(`Current Position : ${userData.currentPost}`);

  doc.fontSize(14).text(`Past Work :`);

  userData.pastWork.forEach((work, index) => {
    doc.fontSize(14).text(`Company Name : ${work.company || "N/A"}`);
    doc.fontSize(14).text(`Position : ${work.position || "N/A"}`);
    doc.fontSize(14).text(`Years : ${work.years || "N/A"}`);
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return outputPath;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username)
      return res.status(400).json({ message: "All fiels are required" });

    const user = await User.findOne({
      email,
    });

    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });

    await newUser.save();

    const profile = new Profile({
      userId: newUser._id,
    });

    await profile.save();

    return res.json({ message: "User Created" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fiels are required" });

    const user = await User.findOne({
      email,
    });

    if (!user) return res.status(404).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = crypto.randomBytes(64).toString("hex");

    await User.findByIdAndUpdate(user._id, { token });

    return res.json({ token, userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = req.file.filename;

    await user.save();

    return res.json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;

    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const { username, email } = newUserData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser && String(existingUser._id) !== String(user._id)) {
      return res.status(400).json({ message: "User already exists" });
    }

    Object.assign(user, newUserData);

    await user.save();

    return res.json({ message: "User updated!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name email username profilePicture",
    );

    return res.json(userProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;

    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const profile_to_update = await Profile.findOne({ userId: user._id });

    Object.assign(profile_to_update, newProfileData);

    await profile_to_update.save();

    return res.json({ message: "Profile Updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name username email profilePicture",
    );

    return res.json({ profiles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;

    const userProfile = await Profile.findOne({ userId: user_id }).populate(
      "userId",
      "name username email profilePicture",
    );

    let outputPath = await convertUserDataToPDF(userProfile);
    return res.json({ message: outputPath });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const connectionUser = await User.findById(connectionId);

    if (!connectionUser)
      return res.status(404).json({ message: "Connection user not found!" });

    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Connection request already sent!" });
    }

    const newRequest = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    await newRequest.save();

    return res.json({ message: "Connection request sent!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyConnectionRequests = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const connections = await ConnectionRequest.find({
      userId: user._id,
    }).populate("connectionId", "name username email profilePicture");

    return res.json(connections);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
export const getUserGotConnectionRequest = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const connections = await ConnectionRequest.find({
      connectionId: user._id,
    }).populate("userId", "name username email profilePicture");

    return res.json(connections);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) return res.status(404).json({ message: "User not found!" });

    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest)
      return res.status(404).json({ message: "Connection request not found!" });

    if (action_type === "accept") {
      connectionRequest.status_accepted = true;
    } else if (action_type === "reject") {
      connectionRequest.status_accepted = false;
    } else {
      return res.status(400).json({ message: "Invalid action type!" });
    }
    await connectionRequest.save();
    return res.json({ message: `Connection request ${action_type}ed!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
