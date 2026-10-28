const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas Cloud URI
const MONGO_URI = "mongodb://varshigaasree_db_user:AcaS7WjRmAslrwRr@ac-ayvke9i-shard-00-00.jk7aqcj.mongodb.net:27017,ac-ayvke9i-shard-00-01.jk7aqcj.mongodb.net:27017,ac-ayvke9i-shard-00-02.jk7aqcj.mongodb.net:27017/dyslexiread?ssl=true&replicaSet=atlas-9ra2fv-shard-0&authSource=admin";

mongoose.connect(MONGO_URI)
  .then(() => console.log("[CLOUD DB] Connected to permanent MongoDB Atlas successfully."))
  .catch((err) => console.log("[DB NOTICE] Connection error:", err.message));

// Schema with userId and password protection
const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fontSize: { type: Number, default: 18 },
  lineHeight: { type: Number, default: 1.8 },
  letterSpacing: { type: Number, default: 0.12 },
  tintColor: { type: String, default: "#fbf0d9" },
  fontChoice: { type: String, default: "OpenDyslexic" }
});

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);

// 1. REGISTER NEW USER (Blocks if ID already exists)
app.post("/api/auth/register", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "ID and password required." });
  }

  try {
    const existingUser = await UserProfile.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User ID already exists! Please choose a different ID or log in."
      });
    }

    const newUser = new UserProfile({ userId, password });
    await newUser.save();
    res.json({ success: true, message: "Account created!", profile: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. LOGIN EXISTING USER
app.post("/api/auth/login", async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await UserProfile.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User ID not found. Please register first." });
    }
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Incorrect password!" });
    }
    res.json({ success: true, message: "Login successful!", profile: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. SAVE CUSTOMIZATIONS (Only allowed for authenticated profile owner)
app.post("/api/profile/save", async (req, res) => {
  const { userId, password, lineHeight, letterSpacing, tintColor } = req.body;

  try {
    const user = await UserProfile.findOne({ userId });
    if (!user || user.password !== password) {
      return res.status(403).json({ success: false, message: "Unauthorized. Please log in first." });
    }

    user.lineHeight = lineHeight;
    user.letterSpacing = letterSpacing;
    user.tintColor = tintColor;
    await user.save();

    res.json({ success: true, profile: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. FETCH USER PROFILE (Hydration endpoint)
app.get("/api/profile/:userId", async (req, res) => {
  try {
    const user = await UserProfile.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.json({ success: true, profile: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`DyslexiRead Backend listening on port ${PORT}`));