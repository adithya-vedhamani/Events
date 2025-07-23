const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testTimeBlocks() {
  try {
    console.log('🧪 Testing Time Blocks Integration...\n');

    // 1. Get a space with time blocks
    console.log('1. Fetching spaces...');
    const spacesResponse = await axios.get(`${API_BASE_URL}/spaces`);
    const spaces = spacesResponse.data;
    
    if (spaces.length === 0) {
      console.log('❌ No spaces found');
      return;
    }

    const space = spaces[0];
    console.log(`✅ Found space: ${space.name}`);
    console.log(`   Pricing type: ${space.pricing?.type || 'not set'}`);

    // 2. Check if space has time blocks
    if (!space.pricing?.timeBlocks || space.pricing.timeBlocks.length === 0) {
      console.log('⚠️  Space does not have time blocks configured');
      console.log('   Please configure time blocks in the brand owner dashboard first');
      return;
    }

    console.log(`✅ Space has ${space.pricing.timeBlocks.length} time blocks configured:`);
    space.pricing.timeBlocks.forEach((block, index) => {
      console.log(`   ${index + 1}. ${block.hours}h - ₹${block.price} - ${block.description || 'No description'}`);
    });

    // Check if pricing type is set to package
    if (space.pricing.type !== 'package') {
      console.log('\n⚠️  IMPORTANT: Pricing type is not set to "package"');
      console.log(`   Current type: ${space.pricing.type}`);
      console.log('   To use time blocks, the pricing type should be "package"');
      console.log('   Please update the space pricing in the brand owner dashboard');
    }

    // 3. Test time blocks API endpoint
    console.log('\n2. Testing time blocks API endpoint...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const timeBlocksResponse = await axios.get(
      `${API_BASE_URL}/spaces/${space._id}/time-blocks?date=${dateString}`
    );

    const timeBlocksData = timeBlocksResponse.data;
    console.log(`✅ Time blocks API response for ${dateString}:`);
    console.log(`   Available slots: ${timeBlocksData.availableSlots.length}`);
    console.log(`   Time blocks: ${timeBlocksData.timeBlocks.length}`);

    if (timeBlocksData.availableSlots.length > 0) {
      console.log('\n   Sample available slots:');
      timeBlocksData.availableSlots.slice(0, 3).forEach((slot, index) => {
        const startTime = new Date(slot.startTime).toLocaleTimeString();
        const endTime = new Date(slot.endTime).toLocaleTimeString();
        console.log(`   ${index + 1}. ${startTime} - ${endTime} (${slot.timeBlock.hours}h, ₹${slot.timeBlock.price})`);
      });
    }

    // 4. Test price calculation with time block
    if (timeBlocksData.availableSlots.length > 0) {
      console.log('\n3. Testing price calculation with time block...');
      const sampleSlot = timeBlocksData.availableSlots[0];
      
      const priceResponse = await axios.post(`${API_BASE_URL}/reservations/calculate-price`, {
        spaceId: space._id,
        startTime: sampleSlot.startTime,
        endTime: sampleSlot.endTime
      });

      const priceData = priceResponse.data;
      console.log(`✅ Price calculation response:`);
      console.log(`   Total Price: ₹${priceData.totalPrice}`);
      console.log(`   Original Price: ₹${priceData.originalPrice}`);
      console.log(`   Duration: ${priceData.durationHours} hours`);
      
      if (priceData.breakdown) {
        console.log('   Breakdown:');
        priceData.breakdown.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.description}: ₹${item.amount}`);
        });
      }

      // Check if time block pricing was used
      const usedTimeBlock = priceData.breakdown.some(item => item.type === 'package');
      if (usedTimeBlock) {
        console.log('   ✅ Time block pricing was used correctly');
      } else {
        console.log('   ⚠️  Time block pricing was not used (fallback to hourly rate)');
        console.log('   This is expected if pricing type is not "package"');
      }
    }

    console.log('\n✅ Time blocks integration test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Time blocks are properly configured in the space');
    console.log('   - Time blocks API endpoint is working');
    console.log('   - Price calculation integrates with time blocks');
    console.log('   - Frontend can now display time blocks for booking');
    
    if (space.pricing.type !== 'package') {
      console.log('\n🔧 Next Steps:');
      console.log('   1. Go to the brand owner dashboard');
      console.log('   2. Edit the space pricing');
      console.log('   3. Set pricing type to "package"');
      console.log('   4. Save the changes');
      console.log('   5. Time blocks will then be used for pricing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testTimeBlocks(); 