const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function createStaffWithBcrypt() {
  try {
    console.log('=== CREATING STAFF WITH BCRYPT ===\n');

    // Find a brand owner
    const brandOwner = await User.findOne({ role: 'brand_owner' });
    if (!brandOwner) {
      console.log('No brand owner found. Please create a brand owner first.');
      return;
    }

    console.log(`Using brand owner: ${brandOwner.firstName} ${brandOwner.lastName} (${brandOwner.email})`);

    // Check if staff already exists
    const existingStaff = await User.findOne({ 
      role: 'staff', 
      email: `staff1.${brandOwner.email}` 
    });
    
    if (existingStaff) {
      console.log('Staff already exists. Deleting old staff...');
      await User.deleteMany({ role: 'staff', brandId: brandOwner._id });
    }

    // Create staff user with bcrypt
    const hashedPassword = await bcrypt.hash('staff123', 10);
    
    const staffUser = new User({
      email: `staff1.${brandOwner.email}`,
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Staff',
      phone: '+91-9876543210',
      role: 'staff',
      brandId: brandOwner._id,
      isEmailVerified: true,
      isActive: true,
    });

    await staffUser.save();
    console.log(`✅ Created staff: ${staffUser.firstName} ${staffUser.lastName}`);
    console.log(`📧 Email: ${staffUser.email}`);
    console.log(`🔑 Password: staff123`);
    console.log(`🏢 Brand: ${brandOwner.firstName} ${brandOwner.lastName}`);

    console.log('\n🎯 You can now login with:');
    console.log(`Email: ${staffUser.email}`);
    console.log('Password: staff123');

  } catch (error) {
    console.error('Error creating staff:', error);
  } finally {
    mongoose.connection.close();
  }
}

createStaffWithBcrypt(); 