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

app.get('/', (req, res) => res.send('<h1>Simple Todo App API is running</h1><p>Open the deployed frontend to use the app.</p><p>Developer endpoint: <a href="/name">/name</a></p>'));
app.get('/name', (req, res) => res.send(`<h2>Developer Name: ${process.env.DEVELOPER_NAME || 'Your Name'}</h2>`));

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
