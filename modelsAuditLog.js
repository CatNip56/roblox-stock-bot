import mongoose from 'mongoose';
const S = new mongoose.Schema({
  type: String,
  userId: String,
  stockTicker: String,
  details: mongoose.Schema.Types.Mixed,
  reason: String,
  by: String,
  timestamp: { type: Date, default: Date.now }
});
export default mongoose.models.AuditLog || mongoose.model('AuditLog', S);
