import Fastify from "fastify"
import Database from "better-sqlite3"

const app = Fastify()
const db = new Database("qcm.db")

// base de donnees
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    choix1 TEXT NOT NULL,
    choix2 TEXT NOT NULL,
    choix3 TEXT NOT NULL,
    choix4 TEXT NOT NULL,
    bonne_reponse INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    date TEXT NOT NULL
  );
`)

// insere les questions si la table est vide
const count = db.prepare("SELECT COUNT(*) as count FROM questions").get() as { count: number }

if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO questions (question, choix1, choix2, choix3, choix4, bonne_reponse)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insert.run(
    "Quel mot clé utilise-t-on pour déclarer une constante en JavaScript ?",
    "var", "let", "const", "define", 3
  )
  insert.run(
    "Quelle méthode permet d'ajouter un élément à la fin d'un tableau ?",
    "push()", "pop()", "shift()", "splice()", 1
  )
  insert.run(
    "Qu'est-ce que le DOM ?",
    "Un langage de programmation",
    "La représentation de la page HTML en mémoire",
    "Un framework JavaScript",
    "Une base de données", 2
  )
  insert.run(
    "Quel opérateur compare la valeur ET le type en JavaScript ?",
    "==", "!=", "===", "=>", 3
  )
  insert.run(
    "Comment sélectionner un élément par son id en JavaScript ?",
    "document.getElement('id')",
    "document.querySelector('.id')",
    "document.querySelector('#id')",
    "document.find('#id')", 3
  )
}

// CORS
app.addHook("onRequest", async (request, reply) => {
  reply.header("Access-Control-Allow-Origin", "*")
  reply.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  reply.header("Access-Control-Allow-Headers", "Content-Type")
})

app.options("/*", async (request, reply) => {
  reply.send()
})

// GET /questions — retourne toutes les questions
app.get("/questions", async (request, reply) => {
  const questions = db.prepare("SELECT * FROM questions").all()
  return questions
})

// POST /scores — enregistre un score
app.post("/scores", async (request, reply) => {
  const body = request.body as {
    nom: string
    score: number
    total: number
  }

  if (!body.nom || body.nom.trim() === "") {
    reply.code(400)
    return { error: "Le nom est obligatoire" }
  }

  const date = new Date().toLocaleDateString("fr-FR")

  const result = db
    .prepare("INSERT INTO scores (nom, score, total, date) VALUES (?, ?, ?, ?)")
    .run(body.nom.trim(), body.score, body.total, date)

  const newScore = db
    .prepare("SELECT * FROM scores WHERE id = ?")
    .get(result.lastInsertRowid)

  reply.code(201)
  return newScore
})

// GET /scores — retourne le classement
app.get("/scores", async (request, reply) => {
  const scores = db
    .prepare("SELECT * FROM scores ORDER BY score DESC LIMIT 10")
    .all()
  return scores
})

// DEMARRAGE
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Serveur démarré sur ${address}`)
})