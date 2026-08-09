const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// Database Order Schema
const OrderSchema = new mongoose.Schema({
  id: String,
  type: String,
  table: Number,
  items: Array,
  notes: String,
  status: { type: String, default: 'received' },
  ts: { type: Number, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// REST API Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database connecting... please retry in 5 seconds." });
    }
    const orders = await Order.find().sort({ ts: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    io.emit('new_order', newOrder);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    io.emit('order_updated', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.send('API Server is running live!');
});

// WebSockets
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
});

// Start Express FIRST so Render health check passes
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  // Connect to MongoDB Atlas
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));
});