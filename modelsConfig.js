import mongoose from 'mongoose';
const S = new mongoose.Schema({
  ownerId: String,
  adminRoleId: String,
  fbiRoleId: String,
  advisorRoleId: String
}, { collection: 'bot_config' });
export default mongoose.models.Config || mongoose.model('Config', S);
