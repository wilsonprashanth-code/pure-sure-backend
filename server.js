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

// Prevent queries from timing out silently if disconnected
mongoose.set('bufferCommands', false);

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

// Socket.io Listener
io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
});

// Connect Database BEFORE Starting Server
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // Fast fail on connection issues
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas Cloud Database!');
  server.listen(PORT, () => console.log(`🚀 Cloud Server active on port ${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB Connection Failure:', err.message);
});