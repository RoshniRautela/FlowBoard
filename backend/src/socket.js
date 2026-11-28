import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { findBoardForMember } from "./utils/boardAccess.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  // Runs once per connection: only logged-in users may connect
  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(id);
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.user.email);

    socket.on("board:join", async (boardId) => {
      const board = await findBoardForMember(boardId, socket.user._id);
      console.log("join board", boardId, "allowed:", !!board);
      if (board) socket.join(`board:${board._id}`);
    });

    socket.on("board:leave", (boardId) => {
      socket.leave(`board:${boardId}`);
    });
  });
};

// Controllers call this to notify everyone viewing a board
export const emitToBoard = (boardId, event, payload) => {
  console.log("emit", event, "to board:" + boardId, "| io ready:", !!io);
  io?.to(`board:${boardId}`).emit(event, payload);
};