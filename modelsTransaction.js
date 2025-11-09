import mongoose from 'mongoose';
const S = new mongoose.Schema({
  txType: String,
  userId: String,
  ticker: String,
  shares: Number,
  price: Number,
  timestamp: { type: Date, default: Date.now }
});
export default mongoose.models.Transaction || mongoose.model('Transaction', S);
