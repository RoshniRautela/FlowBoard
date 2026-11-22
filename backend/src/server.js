import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api/health", (req, res) => {
  res.send("Welcome to FlowBoard API");
})

app.listen(process.env.PORT, async () => {
  await connectDB()
  console.log(`Server is running on port ${process.env.PORT}`);
})