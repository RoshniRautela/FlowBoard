# FlowBoard

A real-time collaborative project board (Trello/Linear-style) built with the MERN stack. Create boards, invite teammates, and manage work with lists and cards. Every change shows up instantly for everyone viewing the same board.

**Live demo:** _add your deployed link here_
**Repository:** https://github.com/RoshniRautela/FlowBoard

<!-- Add a GIF of two browser windows syncing here -->
<!-- ![FlowBoard demo](./docs/demo.gif) -->

<!-- Add screenshots here -->
<!-- ![Dashboard](./docs/dashboard.png) -->
<!-- ![Board view](./docs/board.png) -->

## Features

- **Authentication:** register and log in with JWT; passwords are hashed with bcrypt
- **Boards:** create, rename and delete boards; the owner can invite members by email
- **Lists and cards:** add, rename, edit and delete lists and cards
- **Drag and drop:** reorder cards within a list or move them across lists
- **Real-time sync:** changes appear instantly in every open window using Socket.IO, with no refresh
- **Access control:** only board members can view or change a board; only the owner can rename, delete or invite
- **Reconnect handling:** if a connection drops, the board re-syncs automatically when it returns

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios, @hello-pangea/dnd, socket.io-client |
| Backend | Node.js, Express, Mongoose, JSON Web Tokens, bcryptjs, Socket.IO |
| Database | MongoDB Atlas |

## How it works

- **Ordering with fractional positions:** every list and card has a numeric `position`. Dropping a card between two others sets its position to their average, so a move is one small database write and no other documents change.
- **Optimistic updates:** the UI updates the moment you drop a card. If the server rejects the move, the card snaps back and an error is shown.
- **One room per board:** a socket joins a board's room only after the server confirms the user is a member, using the same rule as the REST API.
- **Idempotent client updates:** incoming socket events add or replace items by `_id`, so a change you made yourself is never duplicated when its event arrives.

## Project structure

```
FlowBoard/
  backend/
    scripts/smoke-test.js     # end-to-end API test
    src/
      config/db.js
      controllers/
      middleware/auth.js
      models/                 # User, Board, List, Card
      routes/
      utils/boardAccess.js
      socket.js
      server.js
  frontend/
    src/
      api/axios.js
      components/
      context/AuthContext.jsx
      pages/                  # Login, Register, Dashboard, BoardView
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or a local MongoDB instance)

### 1. Clone the repository

```bash
git clone https://github.com/RoshniRautela/FlowBoard.git
cd FlowBoard
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
CLIENT_URL=http://localhost:5173
```

Start it:

```bash
npm run dev
```

### 3. Set up the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Start it:

```bash
npm run dev
```

Open http://localhost:5173.

### Try the real-time sync

Open the app in a normal window and an incognito window, log in as two different users, add the second user to a board by email, and open that board in both windows. Add, edit, move or delete anything in one window and watch the other update.

## API overview

All routes except register and login require the header `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and get a token |
| GET | `/api/boards` | List your boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/:id` | Get a board with its lists and cards |
| PUT | `/api/boards/:id` | Rename a board (owner) |
| DELETE | `/api/boards/:id` | Delete a board and its contents (owner) |
| POST | `/api/boards/:id/members` | Add a member by email (owner) |
| POST | `/api/boards/:boardId/lists` | Create a list |
| PUT | `/api/lists/:id` | Rename a list |
| DELETE | `/api/lists/:id` | Delete a list and its cards |
| POST | `/api/lists/:listId/cards` | Create a card |
| PUT | `/api/cards/:id` | Edit a card |
| PUT | `/api/cards/:id/move` | Move a card to another list or position |
| DELETE | `/api/cards/:id` | Delete a card |

### Socket events (server to client)

`list:created`, `list:updated`, `list:deleted`, `card:created`, `card:updated`, `card:deleted`, `board:updated`, `board:deleted`

## Testing

With the backend running, from the `backend` folder:

```bash
node scripts/smoke-test.js
```

The script registers test users and exercises every endpoint, covering authentication, access control, CRUD, card moves and cascade deletes, and prints a pass or fail result for each check.

## Roadmap

- Card descriptions and assignees in the UI (already supported by the API)
- A step to renumber positions after many drops into the same gap
- Removing members and leaving a board
- Activity log and card comments
- Automated tests and CI

## Author

Built by **Roshni Rautela**.
