const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-gallery-bhel';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  isAuthorized: { type: Boolean, default: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');
  try {
    const result = await User.deleteMany({ role: 'admin' });
    console.log(`✅ Deleted ${result.deletedCount} admin user(s).`);
  } catch (err) {
    console.error('❌ Error deleting admin users:', err.message);
  }
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main(); 