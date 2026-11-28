import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { DragDropContext } from "@hello-pangea/dnd";
import Navbar from "../components/Navbar";
import ListColumn from "../components/ListColumn";

export default function BoardView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [newList, setNewList] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    api
      .get(`/boards/${id}`)
      .then(({ data }) => {
        setBoard(data.board);
        setLists(data.lists);
        setCards(data.cards);
      })
      .catch((err) => setLoadError(err.response?.data?.message || "Could not load board"))
      .finally(() => setLoading(false));
  }, [id]);

  // Runs an API action; shows the server's message if it fails
  const run = async (action, fallback) => {
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.response?.data?.message || fallback);
    }
  };

  const addList = (e) => {
    e.preventDefault();
    if (!newList.trim()) return;
    run(async () => {
      const { data } = await api.post(`/boards/${id}/lists`, { title: newList });
      setLists((prev) => [...prev, data]);
      setNewList("");
    }, "Could not add list");
  };

  const renameList = (listId, title) =>
    run(async () => {
      const { data } = await api.put(`/lists/${listId}`, { title });
      setLists((prev) => prev.map((l) => (l._id === listId ? data : l)));
    }, "Could not rename list");

  const deleteList = (listId) =>
    run(async () => {
      await api.delete(`/lists/${listId}`);
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCards((prev) => prev.filter((c) => c.list !== listId));
    }, "Could not delete list");

  const addCard = (listId, title) =>
    run(async () => {
      const { data } = await api.post(`/lists/${listId}/cards`, { title });
      setCards((prev) => [...prev, data]);
    }, "Could not add card");

  const updateCard = (cardId, title) =>
    run(async () => {
      const { data } = await api.put(`/cards/${cardId}`, { title });
      setCards((prev) => prev.map((c) => (c._id === cardId ? data : c)));
    }, "Could not update card");

  const deleteCard = (cardId) =>
    run(async () => {
      await api.delete(`/cards/${cardId}`);
      setCards((prev) => prev.filter((c) => c._id !== cardId));
    }, "Could not delete card");

  const onDragEnd = async ({ draggableId, source, destination }) => {
    if (!destination) return; // dropped outside any list
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return; // didn't move

    // Cards in the destination list, in order, without the card being moved
    const destCards = cards
      .filter((c) => c.list === destination.droppableId && c._id !== draggableId)
      .sort((a, b) => a.position - b.position);

    const before = destCards[destination.index - 1];
    const after = destCards[destination.index];

    let position;
    if (before && after) position = (before.position + after.position) / 2;
    else if (after) position = after.position / 2;
    else if (before) position = before.position + 1000;
    else position = 1000;

    // Update the UI immediately, and keep the old state in case the server fails
    const previousCards = cards;
    setError("");
    setCards((prev) =>
      prev.map((c) =>
        c._id === draggableId
          ? { ...c, list: destination.droppableId, position }
          : c
      )
    );

    try {
      await api.put(`/cards/${draggableId}/move`, {
        listId: destination.droppableId,
        position,
      });
    } catch (err) {
      setCards(previousCards); // roll back
      setError(err.response?.data?.message || "Could not move card");
    }
  };

  const addMember = (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    run(async () => {
      const { data } = await api.post(`/boards/${id}/members`, { email: memberEmail });
      setBoard(data);
      setMemberEmail("");
    }, "Could not add member");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <p className="p-8 text-slate-500">Loading...</p>
      </div>
    );

  if (loadError)
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="p-8">
          <p className="text-red-600 mb-3">{loadError}</p>
          <Link to="/" className="text-indigo-600">Back to your boards</Link>
        </div>
      </div>
    );

  const isOwner = board.owner === user.id;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-indigo-600">← All boards</Link>
          <h1 className="text-2xl font-bold">{board.title}</h1>
        </div>

        <div className="text-sm text-slate-600 space-y-2">
          <p>Members: {board.members.map((m) => m.name).join(", ")}</p>
          {isOwner && (
            <form onSubmit={addMember} className="flex gap-2">
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Add member by email"
                className="border rounded px-2 py-1 bg-white"
              />
              <button className="text-indigo-600 font-medium">Add</button>
            </form>
          )}
        </div>
      </div>

      {error && <p className="px-6 text-sm text-red-600">{error}</p>}

      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 items-start">
            {lists.map((list) => (
              <ListColumn
                key={list._id}
                list={list}
                cards={cards.filter((c) => c.list === list._id)}
                onRename={renameList}
                onDelete={deleteList}
                onAddCard={addCard}
                onUpdateCard={updateCard}
                onDeleteCard={deleteCard}
              />
            ))}
          </div>
        </DragDropContext>

        <form onSubmit={addList} className="w-72 shrink-0 bg-slate-200/60 rounded-xl p-3 flex gap-1">
          <input
            value={newList}
            onChange={(e) => setNewList(e.target.value)}
            placeholder="+ Add a list"
            maxLength={100}
            className="flex-1 min-w-0 border rounded px-2 py-1 text-sm bg-white"
          />
          <button className="text-sm text-indigo-600 font-medium px-1">Add</button>
        </form>
      </div>
    </div>

  );
}