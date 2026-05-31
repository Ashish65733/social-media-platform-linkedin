import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postsRoutes from "./routes/posts.routers.js";
import userRoutes from "./routes/user.routers.js";

dotenv.config({ path: '../.env' });

const app = express();

app.use(cors());
app.use(express.json());

app.use(postsRoutes);
app.use(userRoutes);

const start = async () => {
  const connectDB = mongoose.connect(process.env.MONGO_URL);

  app.listen(8080, () => {
    console.log("Server is running on port 8080");
  });
};

start();
