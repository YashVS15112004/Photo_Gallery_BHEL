const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  rl.question('Admin username to reset: ', async (username) => {
    rl.question('New password: ', async (password) => {
      try {
        const hash = await bcrypt.hash(password, 12);
        const user = await User.findOneAndUpdate(
          { username, role: 'admin' },
          { $set: { password: hash } },
          { new: true }
        );
        if (user) {
          console.log('✅ Admin password reset successfully!');
        } else {
          console.log('❌ Admin user not found.');
        }
      } catch (err) {
        console.error('❌ Error resetting password:', err.message);
      }
      mongoose.disconnect();
      rl.close();
    });
  });
}

main(); 