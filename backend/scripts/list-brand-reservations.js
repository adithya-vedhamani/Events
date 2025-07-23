const mongoose = require('mongoose');
require('dotenv').config();

const brandOwnerEmail = process.argv[2];
if (!brandOwnerEmail) {
  console.error('Usage: node scripts/list-brand-reservations.js <brandOwnerEmail>');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({}, { strict: false });
const spaceSchema = new mongoose.Schema({}, { strict: false });
const reservationSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Space = mongoose.model('Space', spaceSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

async function main() {
  try {
    const brandOwner = await User.findOne({ email: brandOwnerEmail, role: 'brand_owner' });
    if (!brandOwner) {
      console.log('No brand owner found for email:', brandOwnerEmail);
      return;
    }
    console.log('Brand Owner:', brandOwner.firstName, brandOwner.lastName, brandOwner.email, '\n_id:', brandOwner._id.toString());

    const spaces = await Space.find({ ownerId: brandOwner._id });
    if (spaces.length === 0) {
      console.log('No spaces found for this brand owner.');
      return;
    }
    console.log(`\nSpaces for this brand owner (${spaces.length}):`);
    spaces.forEach(space => {
      console.log(`- ${space.name || 'Unnamed'} (ID: ${space._id.toString()})`);
    });

    const spaceIds = spaces.map(s => s._id);
    const reservations = await Reservation.find({ spaceId: { $in: spaceIds } });
    if (reservations.length === 0) {
      console.log('\nNo reservations found for these spaces.');
      return;
    }
    console.log(`\nReservations for these spaces (${reservations.length}):`);
    reservations.forEach(res => {
      console.log(`- BookingCode: ${res.bookingCode || 'N/A'} | Status: ${res.status} | Space: ${res.spaceId} | User: ${res.userId} | Start: ${res.startTime} | End: ${res.endTime}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
}

main(); 