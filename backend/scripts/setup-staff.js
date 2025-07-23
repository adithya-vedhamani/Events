const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

// Simple password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function setupStaff() {
  try {
    console.log('=== SETTING UP STAFF USERS ===\n');

    // Find brand owners
    const brandOwners = await User.find({ role: 'brand_owner' });
    console.log(`Found ${brandOwners.length} brand owners`);

    if (brandOwners.length === 0) {
      console.log('No brand owners found. Please create a brand owner first.');
      return;
    }

    // Create staff for each brand owner
    for (const brandOwner of brandOwners) {
      console.log(`\nSetting up staff for brand owner: ${brandOwner.firstName} ${brandOwner.lastName}`);
      
      // Check if staff already exists
      const existingStaff = await User.find({ 
        role: 'staff', 
        brandId: brandOwner._id 
      });
      
      if (existingStaff.length > 0) {
        console.log(`  Staff already exists for this brand (${existingStaff.length} staff members)`);
        continue;
      }

      // Create staff users
      const staffUsers = [
        {
          email: `staff1.${brandOwner.email}`,
          password: 'staff123',
          firstName: 'John',
          lastName: 'Staff',
          phone: '+91-9876543210',
          role: 'staff',
          brandId: brandOwner._id,
          isEmailVerified: true,
          isActive: true,
        },
        {
          email: `staff2.${brandOwner.email}`,
          password: 'staff123',
          firstName: 'Jane',
          lastName: 'Manager',
          phone: '+91-9876543211',
          role: 'staff',
          brandId: brandOwner._id,
          isEmailVerified: true,
          isActive: true,
        }
      ];

      for (const staffData of staffUsers) {
        // Hash password
        const hashedPassword = hashPassword(staffData.password);
        
        const staffUser = new User({
          ...staffData,
          password: hashedPassword,
        });

        await staffUser.save();
        console.log(`  Created staff: ${staffUser.firstName} ${staffUser.lastName} (${staffUser.email})`);
      }
    }

    // Show all staff
    console.log('\n=== ALL STAFF USERS ===');
    const allStaff = await User.find({ role: 'staff' });
    
    for (const staff of allStaff) {
      console.log(`Staff: ${staff.firstName} ${staff.lastName}`);
      console.log(`  Email: ${staff.email}`);
      console.log(`  Brand ID: ${staff.brandId || 'No brand assigned'}`);
      console.log(`  Phone: ${staff.phone || 'N/A'}`);
      console.log('');
    }

    console.log('Staff setup completed!');
    console.log('\nStaff can now login with:');
    console.log('- Email: staff1.[brand-owner-email]');
    console.log('- Password: staff123');

  } catch (error) {
    console.error('Error setting up staff:', error);
  } finally {
    mongoose.connection.close();
  }
}

setupStaff(); 