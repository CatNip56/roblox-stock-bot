const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ownerId: String,
  name: String,
  official: String,
  price: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', stockSchema);
