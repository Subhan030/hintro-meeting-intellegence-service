import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.get("/health", (_, res) => {
  res.json({ status: "UP" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});