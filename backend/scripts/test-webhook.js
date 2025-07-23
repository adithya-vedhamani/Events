const crypto = require('crypto');

// Test webhook payload
const testWebhookPayload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_test_' + Date.now(),
        order_id: 'order_test_' + Date.now(),
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        status: 'captured',
        method: 'card',
        captured: true,
        description: 'Test payment',
        email: 'test@example.com',
        contact: '+919876543210',
        notes: {
          reservationId: 'test_reservation_id'
        },
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  }
};

// Generate webhook signature
function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Test webhook signature verification
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Use simple string comparison for testing
  return signature === expectedSignature;
}

// Usage example
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';

console.log('=== Razorpay Webhook Testing ===\n');

// Generate signature
const signature = generateWebhookSignature(testWebhookPayload, webhookSecret);
console.log('Generated Signature:', signature);

// Verify signature
const isValid = verifyWebhookSignature(testWebhookPayload, signature, webhookSecret);
console.log('Signature Valid:', isValid);

// Test with invalid signature
const invalidSignature = 'invalid_signature';
const isInvalid = verifyWebhookSignature(testWebhookPayload, invalidSignature, webhookSecret);
console.log('Invalid Signature Test:', isInvalid);

console.log('\n=== Test Payload ===');
console.log(JSON.stringify(testWebhookPayload, null, 2));

console.log('\n=== cURL Command for Testing ===');
console.log(`curl -X POST http://localhost:3001/api/webhooks/razorpay \\
  -H "Content-Type: application/json" \\
  -H "x-razorpay-signature: ${signature}" \\
  -d '${JSON.stringify(testWebhookPayload)}'`);

console.log('\n=== Instructions ===');
console.log('1. Set RAZORPAY_WEBHOOK_SECRET in your .env file');
console.log('2. Start your backend server');
console.log('3. Run the cURL command above to test the webhook');
console.log('4. Check your server logs for webhook processing');
console.log('5. Verify that email is sent by webhook, not frontend verification'); 