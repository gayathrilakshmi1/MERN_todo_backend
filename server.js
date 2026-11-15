import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const schema = new mongoose.Schema({title: { type: String, required: true }, completed: { type: Boolean, default: false }}, { timestamps: true });
const Item = mongoose.model('Todo', schema);

app.get('/name', (req, res) => res.send(`<h2>Developer Name: ${process.env.DEVELOPER_NAME || 'Your Name'}</h2>`));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Simple Todo App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f4f4;
          padding: 40px 15px;
        }
        .container {
          max-width: 500px;
          margin: auto;
          background: white;
          padding: 25px;
          border-radius: 10px;
        }
        h1 { text-align: center; }
        form { display: flex; gap: 8px; }
        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        button {
          padding: 10px 14px;
          border: none;
          background: #222;
          color: white;
          border-radius: 5px;
          cursor: pointer;
        }
        li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
        }
        .completed { text-decoration: line-through; color: gray; }
        .actions { display: flex; gap: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>My Todo List</h1>
        <form id="todoForm">
          <input id="todoInput" placeholder="Enter a task..." required>
          <button type="submit">Add</button>
        </form>
        <ul id="todoList"></ul>
        <p><a href="/name">Developer Name</a></p>
      </div>

      <script>
        const list = document.getElementById('todoList');
        const form = document.getElementById('todoForm');
        const input = document.getElementById('todoInput');

        async function loadTodos() {
          const response = await fetch('/api/todos');
          const todos = await response.json();
          list.innerHTML = '';

          todos.forEach(todo => {
            const li = document.createElement('li');

            const title = document.createElement('span');
            title.textContent = todo.title;
            if (todo.completed) title.className = 'completed';

            const actions = document.createElement('div');
            actions.className = 'actions';

            const toggle = document.createElement('button');
            toggle.textContent = todo.completed ? 'Undo' : 'Done';
            toggle.onclick = () => updateTodo(todo, {
              completed: !todo.completed
            });

            const edit = document.createElement('button');
            edit.textContent = 'Edit';
            edit.onclick = () => {
              const newTitle = prompt('Edit task:', todo.title);
              if (newTitle && newTitle.trim()) {
                updateTodo(todo, { title: newTitle.trim() });
              }
            };

            const remove = document.createElement('button');
            remove.textContent = 'Delete';
            remove.onclick = () => deleteTodo(todo._id);

            actions.append(toggle, edit, remove);
            li.append(title, actions);
            list.appendChild(li);
          });
        }

        async function updateTodo(todo, changes) {
          await fetch('/api/todos/' + todo._id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes)
          });
          loadTodos();
        }

        async function deleteTodo(id) {
          await fetch('/api/todos/' + id, { method: 'DELETE' });
          loadTodos();
        }

        form.addEventListener('submit', async event => {
          event.preventDefault();
          const title = input.value.trim();
          if (!title) return;

          await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });

          input.value = '';
          loadTodos();
        });

        loadTodos();
      </script>
    </body>
    </html>
  `);
});


app.get('/api/todos', async (req, res) => {
  try { res.json(await Item.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});
app.post('/api/todos', async (req, res) => {
  try { res.status(201).json(await Item.create(req.body)); }
  catch (err) { res.status(400).json({ message: err.message }); }
});
app.put('/api/todos/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Backend running on ${PORT}`)))
  .catch(err => console.error('MongoDB connection failed:', err.message));
