// ==========================================
// TEST DE CONNEXION INITIAL
// ==========================================
console.log("Frontend chargé !");

fetch("http://localhost:3000/ping")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

// ==========================================
// PATTERN OBSERVER (Le système d'alerte)
// ==========================================

// Modèle pour les Observateurs (ex: la View) qui attendent des changements
class Observer {
  notify() {
    throw new Error("Tu dois implémenter notify() !");
  }
}

// Gestionnaire qui maintient la liste des abonnés et les alerte
class Notifier {
  #observers = []; // Liste privée des abonnés

  // S'abonner aux alertes
  addObserver(observer) {
    this.#observers.push(observer);
  }

  // Alerter tout le monde
  notify() {
    this.#observers.forEach((observer) => observer.notify());
  }
}

// ==========================================
// MODELE DE DONNÉES
// ==========================================

// Structure propre pour représenter un seul Todo
class Todo {
  #id;
  #text;
  #done;

  constructor(id, text, done) {
    this.#id = id;
    this.#text = text;
    this.#done = done === 1 || done === true; // Convertit en vrai/faux
  }

  // Permet de lire les variables privées à l'extérieur
  get id()   { return this.#id; }
  get text() { return this.#text; }
  get done() { return this.#done; }
}

// ==========================================
// CONTROLLER (Gestion des données et API)
// ==========================================

// Le Controller hérite de Notifier pour pouvoir alerter la View
class Controller extends Notifier {
  #todos = []; // Liste privée des todos sur le client

  get todos() { return this.#todos; }

  // Charger les todos depuis le serveur
  async loadTodos() {
    const response = await fetch("http://localhost:3000/todos");
    const data = await response.json();
    // Transforme le JSON reçu en vrais objets "Todo"
    this.#todos = data.map((t) => new Todo(t.id, t.text, t.done));
    this.notify(); // Alerte la View pour mettre à jour l'écran
  }

  // Ajouter un todo sur le serveur
  async addTodo(text) {
    if (text.trim() === "") return;

    const response = await fetch("http://localhost:3000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    // Ajoute le nouveau todo créé à notre liste locale
    this.#todos.push(new Todo(data.id, data.text, data.done));
    this.notify(); // Alerte la View
  }

  // Supprimer un todo sur le serveur
  async deleteTodo(id) {
    await fetch(`http://localhost:3000/todos/${id}`, {
      method: "DELETE"
    });

    // Retire le todo de notre liste locale
    this.#todos = this.#todos.filter((t) => t.id !== id);
    this.notify(); // Alerte la View
  }

  // Cocher / Décocher un todo sur le serveur
  async toggleTodo(id) {
    const todo = this.#todos.find((t) => t.id === id);
    if (!todo) return;

    const response = await fetch(`http://localhost:3000/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }) // Inverse l'état actuel
    });

    const data = await response.json();
    // Remplace l'ancien todo par le nouveau mis à jour
    this.#todos = this.#todos.map((t) =>
      t.id === id ? new Todo(data.id, data.text, data.done) : t
    );
    this.notify(); // Alerte la View
  }
}

// ==========================================
// VIEW (Gestion de l'affichage HTML)
// ==========================================

// La View hérite d'Observer pour écouter le Controller
class View extends Observer {
  #controller;

  constructor(controller) {
    super();
    this.#controller = controller;

    // S'abonner aux changements du controller
    this.#controller.addObserver(this);

    // Événement clic sur le bouton Ajouter
    const btnAdd = document.querySelector("#btn-add");
    btnAdd.addEventListener("click", () => this.#onClickAdd());

    // Événement touche Entrée dans la barre de saisie
    const input = document.querySelector("#txt-todo");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.#onClickAdd();
    });
  }

  // Reçu quand le Controller dit "j'ai modifié mes données !"
  notify() {
    this.#render(); // Relance le dessin de la liste
  }

  // Action du bouton ajouter
  #onClickAdd() {
    const input = document.querySelector("#txt-todo");
    const text = input.value;
    this.#controller.addTodo(text);
    input.value = ""; // Vide l'input
  }

  // Redessiner toute la liste dans le HTML
  #render() {
    const list = document.querySelector("#todo-list");
    const counter = document.querySelector("#counter");
    const todos = this.#controller.todos;

    // Vider l'ancienne liste HTML pour éviter les doublons
    list.innerHTML = "";

    // Créer un <li> complet pour chaque todo
    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.classList.add("todo-item");
      if (todo.done) li.classList.add("done");

      // 1. Créer la Case à cocher (Checkbox)
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => {
        this.#controller.toggleTodo(todo.id);
      });

      // 2. Créer le Texte de la tâche
      const span = document.createElement("span");
      span.textContent = todo.text;

      // 3. Créer le Bouton supprimer
      const btnDelete = document.createElement("button");
      btnDelete.textContent = "❌";
      btnDelete.classList.add("btn-delete");
      btnDelete.addEventListener("click", () => {
        this.#controller.deleteTodo(todo.id);
      });

      // Assembler les éléments dans le <li>
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(btnDelete);

      // Ajouter le <li> dans la liste <ul> du HTML
      list.appendChild(li);
    });

    // Mettre à jour le compteur de tâches restantes
    const remaining = todos.filter((t) => !t.done).length;
    counter.textContent = `${remaining} tâche(s) restante(s)`;
  }
}

// ==========================================
// DÉMARRAGE DE L'APPLICATION
// ==========================================
window.addEventListener("load", async () => {
  const controller = new Controller();
  const view = new View(controller);

  // Charger les todos existants au démarrage de la page
  await controller.loadTodos();
});