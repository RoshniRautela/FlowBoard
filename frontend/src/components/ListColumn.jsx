import { useState } from "react";
import CardItem from "./CardItem";

export default function ListColumn({
  list, cards, onRename, onDelete, onAddCard, onUpdateCard, onDeleteCard,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [newCard, setNewCard] = useState("");

  const saveTitle = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onRename(list._id, title);
    setEditing(false);
  };

  const submitCard = async (e) => {
    e.preventDefault();
    if (!newCard.trim()) return;
    await onAddCard(list._id, newCard);
    setNewCard("");
  };

  return (
    <div className="w-72 shrink-0 bg-slate-200 rounded-xl p-3 flex flex-col gap-3 self-start">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <form onSubmit={saveTitle} className="flex-1 flex gap-1">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="flex-1 min-w-0 border rounded px-2 py-1 text-sm"
            />
            <button className="text-xs text-indigo-600 font-medium">Save</button>
          </form>
        ) : (
          <h3 className="font-semibold text-sm">
            {list.title} <span className="text-slate-500 font-normal">({cards.length})</span>
          </h3>
        )}
        {!editing && (
          <div className="flex gap-2 text-xs">
            <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-indigo-600">Rename</button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${list.title}" and its cards?`)) onDelete(list._id);
              }}
              className="text-slate-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <CardItem key={card._id} card={card} onUpdate={onUpdateCard} onDelete={onDeleteCard} />
        ))}
      </div>

      <form onSubmit={submitCard} className="flex gap-1">
        <input
          value={newCard}
          onChange={(e) => setNewCard(e.target.value)}
          placeholder="+ Add a card"
          maxLength={200}
          className="flex-1 min-w-0 border rounded px-2 py-1 text-sm bg-white"
        />
        <button className="text-sm text-indigo-600 font-medium px-1">Add</button>
      </form>
    </div>
  );
}