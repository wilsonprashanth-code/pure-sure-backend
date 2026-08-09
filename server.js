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

// Socket.io Setup for Real-time Stream Sync
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// --- MONGOOSE SCHEMAS & MODELS ---

// 1. Order Schema
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

// 2. Menu Item Schema (with Stock Toggle Support)
const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'cafe' },
  inStock: { type: Boolean, default: true }
});
const MenuItem = mongoose.model('MenuItem', MenuSchema);


// --- REST API ENDPOINTS ---

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('API Server is running live!');
});


// === ORDERS API ===

// GET: Fetch all active & past orders
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

// POST: Create a new order from customer menu
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    // Broadcast live event to staff dashboard via Socket.io
    io.emit('new_order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Update order status (received -> preparing -> ready -> completed)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    
    // Broadcast updated order status
    io.emit('order_updated', updatedOrder);
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// === MENU & INVENTORY STOCK API ===

// GET: Fetch all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add new dish / product to cloud database
app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    
    // Broadcast menu update to connected customer screens
    io.emit('menu_updated');
    
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Toggle item In-Stock / Out-of-Stock status
app.put('/api/menu/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { inStock: req.body.inStock },
      { new: true }
    );
    
    // Broadcast stock toggle event
    io.emit('menu_updated');
    
    res.json(updatedItem);
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
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://wilsonprashanth_db_user:c34BzDaqyAIc3kRR@cluster0.pcotgkg.mongodb.net/pure_sure_db?retryWrites=true&w=majority";

server.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
  
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));
});