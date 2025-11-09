import mongoose from 'mongoose';
const S = new mongoose.Schema({
  discordId: { type: String, unique: true },
  balance: { type: Number, default: 10000 },
  holdings: [{ ticker: String, shares: Number }],
  tier: { type: String, default: 'free' }
});
export default mongoose.models.User || mongoose.model('User', S);
