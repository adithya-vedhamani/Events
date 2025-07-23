import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from '../reservations/schemas/reservation.schema';
import { Payment } from './schemas/payment.schema';
import { EmailService } from '../email/email.service';
import { User } from '../users/schemas/user.schema';
import { Space } from '../spaces/schemas/space.schema';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Space.name) private spaceModel: Model<Space>,
    private emailService: EmailService,
    private reservationsService: ReservationsService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async initializePayment(reservationId: string, amount: number) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    if (reservation.status !== 'pending_payment') {
      throw new HttpException('Reservation is not in pending payment status', HttpStatus.BAD_REQUEST);
    }

    // Create Razorpay order
    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `reservation_${reservationId}`,
      notes: {
        reservationId: reservationId,
      },
    });

    // Create payment record
    const payment = new this.paymentModel({
      reservationId,
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'razorpay',
    });

    await payment.save();

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(
    reservationId: string,
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string,
  ) {
    const reservation = await this.reservationModel.findById(reservationId)
      .populate('userId', 'firstName lastName email')
      .populate('spaceId', 'name address');
    
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    // Type assertions for populated fields
    const user = reservation.userId as unknown as { email: string; firstName: string; lastName: string };
    const space = reservation.spaceId as unknown as { name: string; address: string };

    const payment = await this.paymentModel.findOne({ reservationId, orderId: razorpay_order_id });
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      throw new HttpException('Invalid payment signature', HttpStatus.BAD_REQUEST);
    }

    // Verify payment with Razorpay
    try {
      const razorpayPayment = await this.razorpay.payments.fetch(razorpay_payment_id);
      
      if (razorpayPayment.status === 'captured') {
        // Update payment record
        payment.paymentId = razorpay_payment_id;
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();

        // Update reservation
        reservation.status = 'confirmed';
        reservation.paymentStatus = 'completed';
        reservation.paymentId = razorpay_payment_id;
        await reservation.save();

        // Note: Email will be sent by webhook, not here
        // This ensures webhook is the single source of truth for payment confirmation

        return {
          success: true,
          message: 'Payment verified successfully',
          reservation: reservation,
        };
      } else {
        throw new HttpException('Payment not captured', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new HttpException('Payment verification failed', HttpStatus.BAD_REQUEST);
    }
  }

  async processRefund(reservationId: string, amount?: number, reason?: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
    }

    const payment = await this.paymentModel.findOne({ reservationId });
    if (!payment || payment.status !== 'completed') {
      throw new HttpException('No completed payment found for refund', HttpStatus.BAD_REQUEST);
    }

    const refundAmount = amount || payment.amount;

    try {
      // Create refund with Razorpay
      const refund = await this.razorpay.payments.refund(payment.paymentId, {
        amount: Math.round(refundAmount * 100), // Convert to paise
        notes: {
          reason: reason || 'Customer request',
          reservationId: reservationId,
        },
      });

      // Update payment record
      payment.refundId = refund.id;
      payment.refundAmount = refundAmount;
      payment.refundReason = reason || 'Customer request';
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      await payment.save();

      // Update reservation
      reservation.status = 'cancelled';
      reservation.paymentStatus = 'refunded';
      await reservation.save();

      return {
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id,
        amount: refundAmount,
      };
    } catch (error) {
      throw new HttpException('Refund processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  async getPaymentHistory(reservationId: string) {
    return await this.paymentModel.find({ reservationId }).sort({ createdAt: -1 });
  }

  async getPaymentById(paymentId: string) {
    return await this.paymentModel.findById(paymentId);
  }

  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
    }

    const { event, payload } = body;

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(payload.refund.entity);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return { success: true };
  }

  private async handlePaymentCaptured(payment: any) {
    const paymentRecord = await this.paymentModel.findOne({ paymentId: payment.id });
    if (paymentRecord) {
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'confirmed';
        reservation.paymentStatus = 'completed';
        await reservation.save();
      }
    }
  }

  private async handlePaymentFailed(payment: any) {
    const paymentRecord = await this.paymentModel.findOne({ paymentId: payment.id });
    if (paymentRecord) {
      paymentRecord.status = 'failed';
      paymentRecord.failureReason = payment.error_description;
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'pending_payment';
        reservation.paymentStatus = 'failed';
        await reservation.save();
      }
    }
  }

  private async handleRefundProcessed(refund: any) {
    const paymentRecord = await this.paymentModel.findOne({ paymentId: refund.payment_id });
    if (paymentRecord) {
      paymentRecord.refundId = refund.id;
      paymentRecord.refundAmount = refund.amount / 100; // Convert from paise
      paymentRecord.status = 'refunded';
      paymentRecord.refundedAt = new Date();
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'cancelled';
        reservation.paymentStatus = 'refunded';
        await reservation.save();
      }
    }
  }

  // Email notification methods for webhook events
  async sendPaymentConfirmationEmail(reservationId: string) {
    try {
      const reservation = await this.reservationModel.findById(reservationId)
        .populate('userId', 'firstName lastName email')
        .populate('spaceId', 'name address');

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const user = reservation.userId as unknown as { email: string; firstName: string; lastName: string };
      const space = reservation.spaceId as unknown as { name: string; address: string };

      // Generate ICS attachment
      let icsAttachment: any = undefined;
      try {
        icsAttachment = await this.reservationsService.generateIcsForReservation(reservationId);
      } catch (e) {
        console.error('Failed to generate ICS for email:', e);
      }

      await this.emailService.sendBookingConfirmationEmail(
        user.email,
        user.firstName,
        {
          bookingCode: reservation.bookingCode,
          spaceName: space.name,
          spaceAddress: space.address,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          totalAmount: reservation.totalAmount,
          pricingBreakdown: reservation.pricingBreakdown,
        },
        icsAttachment
      );
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      throw error;
    }
  }

  async sendPaymentFailureEmail(reservationId: string) {
    try {
      const reservation = await this.reservationModel.findById(reservationId)
        .populate('userId', 'firstName lastName email')
        .populate('spaceId', 'name address');

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const user = reservation.userId as unknown as { email: string; firstName: string; lastName: string };
      const space = reservation.spaceId as unknown as { name: string; address: string };

      await this.emailService.sendPaymentFailureEmail(
        user.email,
        user.firstName,
        {
          bookingCode: reservation.bookingCode,
          spaceName: space.name,
          spaceAddress: space.address,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          totalAmount: reservation.totalAmount,
        }
      );
    } catch (error) {
      console.error('Failed to send payment failure email:', error);
      throw error;
    }
  }

  async sendRefundConfirmationEmail(reservationId: string) {
    try {
      const reservation = await this.reservationModel.findById(reservationId)
        .populate('userId', 'firstName lastName email')
        .populate('spaceId', 'name address');

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const user = reservation.userId as unknown as { email: string; firstName: string; lastName: string };
      const space = reservation.spaceId as unknown as { name: string; address: string };

      const payment = await this.paymentModel.findOne({ reservationId });

      await this.emailService.sendRefundConfirmationEmail(
        user.email,
        user.firstName,
        {
          bookingCode: reservation.bookingCode,
          spaceName: space.name,
          spaceAddress: space.address,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          refundAmount: payment?.refundAmount || reservation.totalAmount,
          refundReason: payment?.refundReason || 'Customer request',
        }
      );
    } catch (error) {
      console.error('Failed to send refund confirmation email:', error);
      throw error;
    }
  }
} 