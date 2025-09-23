// controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ------------------- REGISTER -------------------
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: pwd, ...userData } = user.toObject();
    res.status(201).json({ message: "User registered successfully", user: userData, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- LOGIN -------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: pwd, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- UPDATE PROFILE -------------------
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Only allow the user to update their own profile unless admin
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: cannot update other user" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select("-password"); // exclude password

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- RESET PASSWORD -------------------
export const resetPassword = async (req, res) => {
  try {
    const userId = req.user._id; // decoded from JWT middleware
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- DELETE USER (ADMIN ONLY) -------------------
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: `User ${deletedUser.email} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- GET SINGLE USER -------------------
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: cannot view other user" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ------------------- GET ALL USERS (ADMIN ONLY) -------------------
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
