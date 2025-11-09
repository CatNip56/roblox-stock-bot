import mongoose from 'mongoose';
const S = new mongoose.Schema({
  target: String,
  type: String,
  reason: String,
  by: String,
  expiresAt: Date,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.models.Suspension || mongoose.model('Suspension', S);
