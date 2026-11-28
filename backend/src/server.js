import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";

const PORT = process.env.PORT || 3000; 

const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.send("Welcome to FlowBoard API");
})
app.use("/api/auth", authRoutes)
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);

connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});