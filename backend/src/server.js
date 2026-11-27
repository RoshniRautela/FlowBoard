import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api", (req, res) => {
  res.send("Welcome to FlowBoard API");
})
app.use("/api/auth", authRoutes)
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);

app.listen(process.env.PORT, async () => {
  await connectDB()
  console.log(`Server is running on port ${process.env.PORT}`);
})