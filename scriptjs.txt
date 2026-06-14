// ============================================
// VARIABLES GLOBALES
// ============================================

let questions = []
let questionIndex = 0
let score = 0
let nomJoueur = ""
let reponsesJoueur = []

// ============================================
// RECUPERATION DES ELEMENTS DU DOM
// ============================================

const ecranAccueil  = document.getElementById("ecran-accueil")
const ecranQuestion = document.getElementById("ecran-question")
const ecranResultat = document.getElementById("ecran-resultat")

const txtNom        = document.getElementById("txt-nom")
const btnCommencer  = document.getElementById("btn-commencer")
const btnSuivant    = document.getElementById("btn-suivant")
const btnRejouer    = document.getElementById("btn-rejouer")

const numQuestion   = document.getElementById("num-question")
const txtQuestion   = document.getElementById("txt-question")
const choixContainer = document.getElementById("choix-container")
const barreFill     = document.getElementById("barre-fill")

const titreResultat = document.getElementById("titre-resultat")
const txtScore      = document.getElementById("txt-score")
const recapContainer = document.getElementById("recap-container")
const classementEl  = document.getElementById("classement")

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// affiche un ecran, cache les autres
function afficherEcran(ecran) {
  ecranAccueil.classList.add("hidden")
  ecranQuestion.classList.add("hidden")
  ecranResultat.classList.add("hidden")
  ecran.classList.remove("hidden")
}

// ============================================
// CHARGEMENT DES QUESTIONS
// ============================================

async function chargerQuestions() {
  const response = await fetch("http://localhost:3000/questions")
  const data = await response.json()
  questions = data
}

// ============================================
// AFFICHAGE D UNE QUESTION
// ============================================

function afficherQuestion() {
  const q = questions[questionIndex]

  // met a jour la progression
  numQuestion.textContent = questionIndex + 1
  barreFill.style.width = `${((questionIndex) / questions.length) * 100}%`

  // affiche la question
  txtQuestion.textContent = q.question

  // cree les boutons de choix
  choixContainer.innerHTML = ""
  const choix = [q.choix1, q.choix2, q.choix3, q.choix4]

  choix.forEach((texte, index) => {
    const btn = document.createElement("button")
    btn.textContent = texte
    btn.classList.add("choix-btn")

    // quand l utilisateur clique sur un choix
    btn.addEventListener("click", () => {
      // desactive tous les boutons
      document.querySelectorAll(".choix-btn").forEach((b) => {
        b.disabled = true
      })

      const bonneReponse = q.bonne_reponse - 1

      // colorie la bonne reponse en vert
      document.querySelectorAll(".choix-btn")[bonneReponse].classList.add("correct")

      // colorie en rouge si mauvaise reponse
      if (index !== bonneReponse) {
        btn.classList.add("incorrect")
      } else {
        score++
      }

      // memorise la reponse du joueur
      reponsesJoueur.push({
        question: q.question,
        reponseJoueur: texte,
        bonneReponse: choix[bonneReponse],
        correct: index === bonneReponse
      })

      // affiche le bouton suivant
      btnSuivant.classList.remove("hidden")
    })

    choixContainer.appendChild(btn)
  })

  btnSuivant.classList.add("hidden")
}

// ============================================
// QUESTION SUIVANTE
// ============================================

function questionSuivante() {
  questionIndex++

  if (questionIndex < questions.length) {
    afficherQuestion()
  } else {
    // toutes les questions sont repondues
    finirQcm()
  }
}

// ============================================
// FIN DU QCM
// ============================================

async function finirQcm() {
  // enregistre le score dans la base
  await fetch("http://localhost:3000/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom: nomJoueur,
      score: score,
      total: questions.length
    })
  })

  // affiche l ecran de resultat
  afficherResultat()
}

// ============================================
// AFFICHAGE DU RESULTAT
// ============================================

async function afficherResultat() {
  afficherEcran(ecranResultat)

  // titre selon le score
  if (score === questions.length) {
    titreResultat.textContent = "Parfait !"
  } else if (score >= questions.length / 2) {
    titreResultat.textContent = "Bien joué !"
  } else {
    titreResultat.textContent = "Peut mieux faire..."
  }

  txtScore.textContent = `${nomJoueur} — ${score} / ${questions.length} bonnes réponses`

  // recap de toutes les reponses
  recapContainer.innerHTML = ""
  reponsesJoueur.forEach((r) => {
    const div = document.createElement("div")
    div.classList.add("recap-item")
    div.classList.add(r.correct ? "ok" : "ko")
    div.innerHTML = `
      <b>${r.question}</b><br>
      Ta réponse : ${r.reponseJoueur}
      ${!r.correct ? `<br>Bonne réponse : ${r.bonneReponse}` : ""}
    `
    recapContainer.appendChild(div)
  })

  // charge et affiche le classement
  const response = await fetch("http://localhost:3000/scores")
  const scores = await response.json()

  classementEl.innerHTML = ""
  scores.forEach((s, index) => {
    const li = document.createElement("li")
    li.innerHTML = `
      <span>${index + 1}. ${s.nom}</span>
      <span>${s.score}/${s.total} — ${s.date}</span>
    `
    classementEl.appendChild(li)
  })
}

// ============================================
// EVENEMENTS
// ============================================

// bouton commencer
btnCommencer.addEventListener("click", async () => {
  const nom = txtNom.value.trim()
  if (nom === "") {
    alert("Entre ton prénom !")
    return
  }

  nomJoueur = nom
  questionIndex = 0
  score = 0
  reponsesJoueur = []

  await chargerQuestions()
  afficherEcran(ecranQuestion)
  afficherQuestion()
})

// bouton question suivante
btnSuivant.addEventListener("click", () => {
  questionSuivante()
})

// bouton rejouer
btnRejouer.addEventListener("click", () => {
  questionIndex = 0
  score = 0
  reponsesJoueur = []
  txtNom.value = ""
  afficherEcran(ecranAccueil)
})

// ============================================
// LANCEMENT
// ============================================

window.addEventListener("load", () => {
  afficherEcran(ecranAccueil)
})