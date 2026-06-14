"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const app = (0, fastify_1.default)();
const db = new better_sqlite3_1.default("todos.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);
app.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
});
app.options("/*", async (request, reply) => {
    reply.send();
});
app.get("/ping", async (request, reply) => {
    return { message: "pong" };
});
app.get("/todos", async (request, reply) => {
    const todos = db.prepare("SELECT * FROM todos").all();
    return todos;
});
app.post("/todos", async (request, reply) => {
    const body = request.body;
    if (!body.text || body.text.trim() === "") {
        reply.code(400);
        return { error: "Le texte est obligatoire" };
    }
    const result = db
        .prepare("INSERT INTO todos (text, done) VALUES (?, 0)")
        .run(body.text.trim());
    const newTodo = db
        .prepare("SELECT * FROM todos WHERE id = ?")
        .get(result.lastInsertRowid);
    reply.code(201);
    return newTodo;
});
app.delete("/todos/:id", async (request, reply) => {
    const { id } = request.params;
    const todo = db
        .prepare("SELECT * FROM todos WHERE id = ?")
        .get(Number(id));
    if (!todo) {
        reply.code(404);
        return { error: "Todo introuvable" };
    }
    db.prepare("DELETE FROM todos WHERE id = ?").run(Number(id));
    return { message: "Todo supprimé" };
});
app.patch("/todos/:id", async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const todo = db
        .prepare("SELECT * FROM todos WHERE id = ?")
        .get(Number(id));
    if (!todo) {
        reply.code(404);
        return { error: "Todo introuvable" };
    }
    db.prepare("UPDATE todos SET done = ? WHERE id = ?")
        .run(body.done ? 1 : 0, Number(id));
    const updated = db
        .prepare("SELECT * FROM todos WHERE id = ?")
        .get(Number(id));
    return updated;
});
// DÉMARRAGE — toujours en dernier
app.listen({ port: 3000 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Serveur démarré sur ${address}`);
});
