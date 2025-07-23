import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  async createOrder(amount: number, currency: string = 'INR', receipt?: string): Promise<any> {
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: true,
    };

    return this.razorpay.orders.create(options);
  }

  async capturePayment(paymentId: string, amount: number, currency: string = 'INR'): Promise<any> {
    return this.razorpay.payments.capture(paymentId, amount * 100, currency);
  }

  async refundPayment(paymentId: string, amount: number, reason?: string): Promise<any> {
    const options: any = {
      amount: amount * 100,
    };

    if (reason) {
      options.reason = reason;
    }

    return this.razorpay.payments.refund(paymentId, options);
  }

  async getPayment(paymentId: string): Promise<any> {
    return this.razorpay.payments.fetch(paymentId);
  }

  async getOrder(orderId: string): Promise<any> {
    return this.razorpay.orders.fetch(orderId);
  }

  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const text = `${orderId}|${paymentId}`;
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    return signature === expectedSignature;
  }
} 