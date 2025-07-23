const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const spaceSchema = new mongoose.Schema({}, { strict: false });
const reservationSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Space = mongoose.model('Space', spaceSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

async function checkBookings() {
  try {
    console.log('=== CHECKING MONGODB BOOKINGS DATA ===\n');

    // Get all users
    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    
    // Get brand owners
    const brandOwners = users.filter(u => u.role === 'brand_owner');
    console.log(`Brand Owners: ${brandOwners.length}`);
    
    // Get all spaces
    const spaces = await Space.find({});
    console.log(`Total Spaces: ${spaces.length}`);
    
    // Get all reservations
    const reservations = await Reservation.find({});
    console.log(`Total Reservations: ${reservations.length}\n`);

    // Show brand owners and their spaces
    console.log('=== BRAND OWNERS AND THEIR SPACES ===');
    for (const owner of brandOwners) {
      console.log(`\nBrand Owner: ${owner.firstName} ${owner.lastName} (ID: ${owner._id})`);
      
      const ownerSpaces = spaces.filter(s => s.ownerId && s.ownerId.toString() === owner._id.toString());
      console.log(`  Spaces: ${ownerSpaces.length}`);
      
      for (const space of ownerSpaces) {
        console.log(`    - ${space.name} (ID: ${space._id})`);
        
        // Get reservations for this space
        const spaceReservations = reservations.filter(r => 
          r.spaceId && r.spaceId.toString() === space._id.toString()
        );
        console.log(`      Reservations: ${spaceReservations.length}`);
        
        for (const res of spaceReservations) {
          const customer = users.find(u => u._id.toString() === res.userId?.toString());
          console.log(`        - ${customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'} | Status: ${res.status} | Amount: ₹${res.totalAmount}`);
        }
      }
    }

    // Show all reservations with details
    console.log('\n=== ALL RESERVATIONS ===');
    for (const res of reservations) {
      const space = spaces.find(s => s._id.toString() === res.spaceId?.toString());
      const customer = users.find(u => u._id.toString() === res.userId?.toString());
      const owner = users.find(u => u._id.toString() === space?.ownerId?.toString());
      
      console.log(`\nReservation ID: ${res._id}`);
      console.log(`  Space: ${space?.name || 'Unknown'} (ID: ${res.spaceId})`);
      console.log(`  Customer: ${customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'} (ID: ${res.userId})`);
      console.log(`  Owner: ${owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'} (ID: ${space?.ownerId})`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Payment Status: ${res.paymentStatus}`);
      console.log(`  Amount: ₹${res.totalAmount}`);
      console.log(`  Start Time: ${res.startTime}`);
      console.log(`  Created: ${res.createdAt}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkBookings(); 