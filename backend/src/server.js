import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express()
app.use(cors())
app.use(express.json())
// app.use("/api/auth", authRoutes)

app.get("/api", (req, res) => {
  res.send("Welcome to FlowBoard API");
})
app.use("/api/auth", authRoutes)

app.listen(process.env.PORT, async () => {
  await connectDB()
  console.log(`Server is running on port ${process.env.PORT}`);
})