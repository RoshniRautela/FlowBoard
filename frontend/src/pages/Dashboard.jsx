import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/boards")
      .then(({ data }) => setBoards(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load boards"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    try {
      const { data } = await api.post("/boards", { title });
      setBoards((prev) => [data, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create board");
    }
  };

  const handleDelete = async (board) => {
    if (!window.confirm(`Delete "${board.title}" and everything in it?`)) return;
    setError("");
    try {
      await api.delete(`/boards/${board._id}`);
      setBoards((prev) => prev.filter((b) => b._id !== board._id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete board");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Your boards</h1>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6 max-w-md">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title"
            maxLength={100}
            className="flex-1 border rounded-lg px-3 py-2 bg-white"
          />
          <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium">
            Create
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : boards.length === 0 ? (
          <p className="text-slate-500">No boards yet. Create your first one above.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <div key={board._id} className="bg-white rounded-xl shadow p-5 flex flex-col justify-between">
                <Link to={`/boards/${board._id}`} className="block">
                  <h2 className="font-semibold text-lg hover:text-indigo-600">{board.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {board.members.length} member{board.members.length !== 1 && "s"}
                  </p>
                </Link>
                {board.owner === user.id && (
                  <button
                    onClick={() => handleDelete(board)}
                    className="self-end mt-4 text-sm text-slate-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}