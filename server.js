const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup for Real-time Kitchen Updates
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

// --- REST API Endpoints ---

// Root Health Check Route for Render
app.get('/', (req, res) => {
  res.send('API Server is running live!');
});

// GET: Fetch all orders sorted by newest first
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

// POST: Create a new order from Mobile Web App
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    // Broadcast live event to Kitchen Dashboard via WebSockets
    io.emit('new_order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Update order status (e.g., received -> preparing -> ready -> completed)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    
    // Broadcast status change to all connected screens
    io.emit('order_updated', updatedOrder);
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WebSocket Connection Logging
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
});

// --- Server & Database Connection ---
const PORT = process.env.PORT || 3000;

// Uses Environment Variable if present, otherwise falls back directly to string
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://wilsonprashanth_db_user:c34BzDaqyAIc3kRR@cluster0.pcotgkg.mongodb.net/pure_sure_db?retryWrites=true&w=majority";

server.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));
});