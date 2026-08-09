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

// Socket.io Setup for Real-time Kitchen Stream Sync
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// MongoDB Schema for Cafe & Retail Orders
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, default: 'cafe' },
  table: mongoose.Schema.Types.Mixed,
  items: Array,
  notes: { type: String, default: '' },
  status: { type: String, default: 'received' },
  ts: { type: Number, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// --- REST API ENDPOINTS ---

// 1. Root Health Check Route
app.get('/', (req, res) => {
  res.send('API Server is running live!');
});

// 2. GET: Fetch all active & past orders
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

// 3. POST: Create a new order from customer menu or retail store request
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    // Broadcast live event to all connected dashboards via Socket.io
    io.emit('new_order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. PUT: Update order status (received -> preparing -> ready -> completed)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    
    // Broadcast updated order status to all connected screens
    io.emit('order_updated', updatedOrder);
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WebSocket Connection Listener
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
});

// --- SERVER & DATABASE CONNECTION ---
const PORT = process.env.PORT || 10000;

// Direct MongoDB URI Fallback String
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://wilsonprashanth_db_user:c34BzDaqyAIc3kRR@cluster0.pcotgkg.mongodb.net/pure_sure_db?retryWrites=true&w=majority";

server.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));
});