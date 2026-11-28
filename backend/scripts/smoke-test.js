const BASE = process.env.BASE_URL || "http://localhost:3000/api";
let passed = 0;
let failed = 0;

const call = async (method, path, token, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
};

const check = (name, condition) => {
  if (condition) {
    passed++;
    console.log("✅", name);
  } else {
    failed++;
    console.log("❌", name);
  }
};

const run = async () => {
  const stamp = Date.now();
  const pw = "123456";

  // ---------- AUTH ----------
  const a = await call("POST", "/auth/register", null, {
    name: "User A", email: `a${stamp}@test.com`, password: pw,
  });
  check("register user A", a.status === 201 && !!a.data?.token);
  const b = await call("POST", "/auth/register", null, {
    name: "User B", email: `b${stamp}@test.com`, password: pw,
  });
  const c = await call("POST", "/auth/register", null, {
    name: "User C", email: `c${stamp}@test.com`, password: pw,
  });
  check("register users B and C", b.status === 201 && c.status === 201);

  const dup = await call("POST", "/auth/register", null, {
    name: "Dup", email: `a${stamp}@test.com`, password: pw,
  });
  check("duplicate email rejected (409)", dup.status === 409);

  const badLogin = await call("POST", "/auth/login", null, {
    email: `a${stamp}@test.com`, password: "wrongpass",
  });
  check("wrong password rejected (401)", badLogin.status === 401);

  const login = await call("POST", "/auth/login", null, {
    email: `a${stamp}@test.com`, password: pw,
  });
  check("login works", login.status === 200 && !!login.data?.token);

  const tokenA = a.data.token;
  const tokenB = b.data.token;
  const tokenC = c.data.token;

  const noToken = await call("GET", "/boards");
  check("no token rejected (401)", noToken.status === 401);

  // ---------- BOARDS ----------
  const board = await call("POST", "/boards", tokenA, { title: "Test board" });
  check("create board", board.status === 201 && !!board.data?._id);
  const boardId = board.data._id;

  const mine = await call("GET", "/boards", tokenA);
  check("board appears in my boards", mine.data?.some((x) => x._id === boardId));

  const bBefore = await call("GET", `/boards/${boardId}`, tokenB);
  check("non-member cannot view board (403)", bBefore.status === 403);

  const addB = await call("POST", `/boards/${boardId}/members`, tokenA, {
    email: `b${stamp}@test.com`,
  });
  check("owner adds member", addB.status === 200);

  const bAfter = await call("GET", `/boards/${boardId}`, tokenB);
  check("member can view board", bAfter.status === 200);

  const bEdit = await call("PUT", `/boards/${boardId}`, tokenB, { title: "Hacked" });
  check("member cannot rename board (403)", bEdit.status === 403);

  const aEdit = await call("PUT", `/boards/${boardId}`, tokenA, { title: "Renamed board" });
  check("owner can rename board", aEdit.status === 200 && aEdit.data?.title === "Renamed board");

  // ---------- LISTS ----------
  const l1 = await call("POST", `/boards/${boardId}/lists`, tokenA, { title: "To Do" });
  const l2 = await call("POST", `/boards/${boardId}/lists`, tokenA, { title: "Doing" });
  const l3 = await call("POST", `/boards/${boardId}/lists`, tokenA, { title: "Done" });
  check("create 3 lists", [l1, l2, l3].every((l) => l.status === 201));
  check("list positions increase", l1.data.position < l2.data.position && l2.data.position < l3.data.position);

  const list1 = l1.data._id;
  const list2 = l2.data._id;

  const renameList = await call("PUT", `/lists/${list1}`, tokenA, { title: "Backlog" });
  check("rename list", renameList.status === 200 && renameList.data?.title === "Backlog");

  // ---------- CARDS ----------
  const c1 = await call("POST", `/lists/${list1}/cards`, tokenA, { title: "Card one" });
  const c2 = await call("POST", `/lists/${list1}/cards`, tokenB, { title: "Card two (by member B)" });
  check("create cards (owner and member)", c1.status === 201 && c2.status === 201);

  const outsider = await call("POST", `/lists/${list1}/cards`, tokenC, { title: "Nope" });
  check("outsider cannot create card (404)", outsider.status === 404);

  const emptyTitle = await call("POST", `/lists/${list1}/cards`, tokenA, { title: "  " });
  check("empty card title rejected (400)", emptyTitle.status === 400);

  const full = await call("GET", `/boards/${boardId}`, tokenA);
  check("board returns 3 lists and 2 cards", full.data?.lists?.length === 3 && full.data?.cards?.length === 2);

  const card1 = c1.data._id;
  const card2 = c2.data._id;

  const upd = await call("PUT", `/cards/${card1}`, tokenA, { title: "Card one (edited)" });
  check("edit card", upd.status === 200 && upd.data?.title === "Card one (edited)");

  const badAssign = await call("PUT", `/cards/${card1}`, tokenA, {
    assignees: ["507f1f77bcf86cd799439011"],
  });
  check("non-member assignee rejected (400)", badAssign.status === 400);

  const goodAssign = await call("PUT", `/cards/${card1}`, tokenA, {
    assignees: [b.data.user.id],
  });
  check("member assignee accepted", goodAssign.status === 200);

  // ---------- MOVE ----------
  const move = await call("PUT", `/cards/${card1}/move`, tokenA, { listId: list2, position: 1500 });
  check("move card to another list", move.status === 200 && move.data?.list === list2 && move.data?.position === 1500);

  const badMove = await call("PUT", `/cards/${card1}/move`, tokenA, { listId: list2, position: "abc" });
  check("invalid position rejected (400)", badMove.status === 400);

  const after = await call("GET", `/boards/${boardId}`, tokenA);
  const moved = after.data?.cards?.find((x) => x._id === card1);
  check("move persisted in database", moved?.list === list2);

  // ---------- DELETES ----------
  const delList = await call("DELETE", `/lists/${list2}`, tokenA);
  check("delete list", delList.status === 200);

  const afterDel = await call("GET", `/boards/${boardId}`, tokenA);
  check(
    "deleting a list also deleted its cards",
    afterDel.data?.lists?.length === 2 && afterDel.data?.cards?.length === 1
  );

  const delCard = await call("DELETE", `/cards/${card2}`, tokenA);
  check("delete card", delCard.status === 200);

  const delBoardB = await call("DELETE", `/boards/${boardId}`, tokenB);
  check("member cannot delete board (403)", delBoardB.status === 403);

  const delBoard = await call("DELETE", `/boards/${boardId}`, tokenA);
  check("owner deletes board", delBoard.status === 200);

  const gone = await call("GET", `/boards/${boardId}`, tokenA);
  check("deleted board returns 404", gone.status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch((err) => {
  console.error("Could not run tests. Is the server running?", err.message);
  process.exit(1);
});