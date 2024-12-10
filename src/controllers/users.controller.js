import User from "../models/usermodel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// cloudinary config

cloudinary.config({
  cloud_name: "dxzkgploq",
  api_key: "847187945795123",
  api_secret: "OmJIhQWfQCpDiUIQ9-li3c1bezs",
});

// upload image function
const uploadImageToCloudinary = async (localpath) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localpath);
    return uploadResult.url;
  } catch (error) {
    fs.unlinkSync(localpath);
    return null;
  }
};

const generateAccessToken = (user) => {
  return jwt.sign({ email: user.email }, process.env.ACCESS_JWT_SECRET, {
    expiresIn: "6h",
  });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ email: user.email }, process.env.REFRESH_JWT_SECRET, {
    expiresIn: "7d",
  });
};

// register user

const registerUser = async (req, res) => {
  const { email, password, fullName, userName } = req.body;

  if (!email || !password || !fullName || !userName) {
    return res.status(400).json({ message: "all the field are required" });
  }

  const user = await User.findOne({ email: email });
  if (user) return res.status(401).json({ message: "user already exist" });

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Profile Picture is also required" });
  }

  try {
    const uploadResult = await uploadImageToCloudinary(req.file.path);

    if (!uploadResult) {
      return res
        .status(500)
        .json({ message: "error occured while uploading image" });
    }

    const createUser = await User.create({
      email,
      password,
      userName,
      fullName,
      profilePicture: uploadResult,
    });
    res.json({
      message: "user registered successfully",
      data: createUser,
    });
  } catch (error) {
    console.log(error);
  }
};

// login user

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ message: "email required" });
  if (!password) return res.status(400).json({ message: "password required" });
  // email mujood ha bhi ya nahi ha
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "no user found" });
  // password compare krwayenga bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(400).json({ message: "incorrect password" });

  // token generate
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // cookies
  res.cookie("refreshToken", refreshToken, { http: true, secure: false });

  res.json({
    message: "user loggedIn successfully",
    accessToken,
    refreshToken,
    data: user,
  });
};

// logout user
const logoutUser = async (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "user logout successfully" });
};

// refreshtoken
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "no refresh token found!" });

  const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);

  const user = await User.findOne({ email: decodedToken.email });

  if (!user) return res.status(404).json({ message: "invalid token" });

  const generateToken = generateAccessToken(user);
  res.json({ message: "access token generated", accesstoken: generateToken });

  res.json({ decodedToken });
};

// upload image
const uploadImage = async (req, res) => {
  if (!req.file)
    return res.status(400).json({
      message: "no image file uploaded",
    });

  try {
    const uploadResult = await uploadImageToCloudinary(req.file.path);

    if (!uploadResult)
      return res
        .status(500)
        .json({ message: "error occured while uploading image" });

    res.json({
      message: "image uploaded successfully",
      url: uploadResult,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error occured while uploading image" });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  uploadImage,
  uploadImageToCloudinary,
};
