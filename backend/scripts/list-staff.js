const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function main() {
  try {
    const staffUsers = await User.find({ role: 'staff' });
    if (staffUsers.length === 0) {
      console.log('No staff users found.');
      return;
    }
    console.log(`Staff users (${staffUsers.length}):\n`);
    for (const staff of staffUsers) {
      let brandOwner = null;
      if (staff.brandId) {
        brandOwner = await User.findOne({ _id: staff.brandId, role: 'brand_owner' });
      }
      console.log(`- ${staff.firstName} ${staff.lastName} | Email: ${staff.email}`);
      console.log(`  brandId: ${staff.brandId || 'N/A'}`);
      if (brandOwner) {
        console.log(`  Linked Brand Owner: ${brandOwner.firstName} ${brandOwner.lastName} (${brandOwner.email})`);
      } else {
        console.log('  Linked Brand Owner: NOT FOUND');
      }
      console.log('');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
}

main(); 