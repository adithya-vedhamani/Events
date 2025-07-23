import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Get,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ReservationsService } from '../reservations/reservations.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from '../reservations/schemas/reservation.schema';
import { Payment } from './schemas/payment.schema';
import { Webhook, WebhookDocument } from './schemas/webhook.schema';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly reservationsService: ReservationsService,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const startTime = Date.now();
    let webhookRecord: WebhookDocument | null = null;

    try {
      this.logger.log(`Received webhook event: ${body.event}`);

      // Verify webhook signature
      const isValidSignature = this.verifyWebhookSignature(body, signature);

      // Create webhook record for tracking
      webhookRecord = await this.createWebhookRecord(body, isValidSignature);

      if (!isValidSignature) {
        this.logger.error('Invalid webhook signature received');
        await this.updateWebhookRecord(
          String(webhookRecord._id),
          'failed',
          'Invalid signature',
        );
        throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
      }

      const { event, payload }: { event: string; payload: any } = body;

      // Process webhook event
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
        case 'order.paid':
          await this.handleOrderPaid(payload.order.entity);
          break;
        case 'payment.authorized':
          await this.handlePaymentAuthorized(payload.payment.entity);
          break;
        default:
          this.logger.warn(`Unhandled webhook event: ${event}`);
      }

      const processingTime = Date.now() - startTime;
      await this.updateWebhookRecord(
        String(webhookRecord._id),
        'processed',
        undefined,
        processingTime,
      );

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);

      if (webhookRecord) {
        const processingTime = Date.now() - startTime;
        await this.updateWebhookRecord(
          String(webhookRecord._id),
          'failed',
          error.message,
          processingTime,
        );
      }

      // Don't expose internal errors to Razorpay
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private verifyWebhookSignature(body: any, signature: string): boolean {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        this.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
        return false;
      }

      // Create expected signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      // Compare signatures
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        this.logger.warn('Signature mismatch', {
          received: signature,
          expected: expectedSignature,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  private async createWebhookRecord(body: any, signatureVerified: boolean): Promise<WebhookDocument> {
    const { event, payload } = body;
    
    // Generate a unique webhook ID if not provided
    const webhookId = body.webhook_id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract relevant data for payload summary
    const payloadSummary: any = {};
    
    if (payload.payment?.entity) {
      const payment = payload.payment.entity;
      payloadSummary.payment_id = payment.id;
      payloadSummary.order_id = payment.order_id;
      payloadSummary.amount = payment.amount ? payment.amount / 100 : undefined;
      payloadSummary.currency = payment.currency;
      payloadSummary.status = payment.status;
    }
    
    if (payload.order?.entity) {
      const order = payload.order.entity;
      payloadSummary.order_id = order.id;
      payloadSummary.amount = order.amount ? order.amount / 100 : undefined;
      payloadSummary.currency = order.currency;
      payloadSummary.status = order.status;
    }
    
    if (payload.refund?.entity) {
      const refund = payload.refund.entity;
      payloadSummary.payment_id = refund.payment_id;
      payloadSummary.refund_id = refund.id;
      payloadSummary.amount = refund.amount ? refund.amount / 100 : undefined;
      payloadSummary.status = refund.status;
    }

    const webhookRecord = new this.webhookModel({
      webhook_id: webhookId,
      event_type: event,
      processed_at: new Date(),
      payload_summary: payloadSummary,
      status: 'received',
      signature_verified: signatureVerified,
    });

    return await webhookRecord.save();
  }

  private async updateWebhookRecord(webhookId: string, status: string, errorMessage?: string, processingTime?: number) {
    try {
      const updateData: any = { status };
      if (errorMessage) updateData.error_message = errorMessage;
      if (processingTime) updateData.processing_time_ms = processingTime;
      
      await this.webhookModel.findByIdAndUpdate(webhookId, updateData);
    } catch (error) {
      this.logger.error('Failed to update webhook record:', error);
    }
  }

  private async handlePaymentCaptured(payment: any) {
    try {
      this.logger.log(`Processing payment captured: ${payment.id}`);
      
      // Try to find payment record by payment ID first
      let paymentRecord = await this.paymentModel.findOne({ paymentId: payment.id });
      
      // If not found, try to find by order ID (for cases where webhook arrives before frontend verification)
      if (!paymentRecord && payment.order_id) {
        paymentRecord = await this.paymentModel.findOne({ orderId: payment.order_id });
        if (paymentRecord) {
          // Update the payment ID if it wasn't set
          paymentRecord.paymentId = payment.id;
        }
      }
      
      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for payment ID: ${payment.id} or order ID: ${payment.order_id}`);
        return;
      }

      // Update payment record
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      paymentRecord.razorpayPaymentId = payment.id;
      paymentRecord.amount = payment.amount / 100; // Convert from paise
      paymentRecord.currency = payment.currency;
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'confirmed';
        reservation.paymentStatus = 'completed';
        reservation.paymentId = payment.id;
        reservation.confirmedAt = new Date();
        await reservation.save();

        this.logger.log(`Payment captured successfully for reservation: ${reservation._id}`);
        
        // Send confirmation email
        try {
          await this.paymentsService.sendPaymentConfirmationEmail(String(reservation._id));
        } catch (emailError) {
          this.logger.error('Failed to send payment confirmation email:', emailError);
        }
      } else {
        this.logger.error(`Reservation not found for payment: ${payment.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling payment captured: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handlePaymentFailed(payment: any) {
    try {
      this.logger.log(`Processing payment failed: ${payment.id}`);
      
      // Try to find payment record by payment ID first
      let paymentRecord = await this.paymentModel.findOne({ paymentId: payment.id });
      
      // If not found, try to find by order ID (for cases where webhook arrives before frontend verification)
      if (!paymentRecord && payment.order_id) {
        paymentRecord = await this.paymentModel.findOne({ orderId: payment.order_id });
        if (paymentRecord) {
          // Update the payment ID if it wasn't set
          paymentRecord.paymentId = payment.id;
        }
      }
      
      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for payment ID: ${payment.id} or order ID: ${payment.order_id}`);
        return;
      }

      // Update payment record
      paymentRecord.status = 'failed';
      paymentRecord.failureReason = payment.error_description || 'Payment failed';
      paymentRecord.failedAt = new Date();
      paymentRecord.razorpayPaymentId = payment.id;
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'pending_payment';
        reservation.paymentStatus = 'failed';
        await reservation.save();

        this.logger.log(`Payment failed for reservation: ${reservation._id}`);
        
        // Send failure notification email
        try {
          await this.paymentsService.sendPaymentFailureEmail(String(reservation._id));
        } catch (emailError) {
          this.logger.error('Failed to send payment failure email:', emailError);
        }
      } else {
        this.logger.error(`Reservation not found for failed payment: ${payment.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling payment failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleRefundProcessed(refund: any) {
    try {
      this.logger.log(`Processing refund: ${refund.id}`);
      
      const paymentRecord = await this.paymentModel.findOne({ paymentId: refund.payment_id });
      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for refund payment ID: ${refund.payment_id}`);
        return;
      }

      // Update payment record
      paymentRecord.refundId = refund.id;
      paymentRecord.refundAmount = refund.amount / 100; // Convert from paise
      paymentRecord.status = 'refunded';
      paymentRecord.refundedAt = new Date();
      paymentRecord.refundReason = refund.notes?.reason || 'Customer request';
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'cancelled';
        reservation.paymentStatus = 'refunded';
        reservation.cancelledAt = new Date();
        await reservation.save();

        this.logger.log(`Refund processed for reservation: ${reservation._id}`);
        
        // Send refund confirmation email
        try {
          await this.paymentsService.sendRefundConfirmationEmail(String(reservation._id));
        } catch (emailError) {
          this.logger.error('Failed to send refund confirmation email:', emailError);
        }
      } else {
        this.logger.error(`Reservation not found for refund: ${refund.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling refund processed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleOrderPaid(order: any) {
    try {
      this.logger.log(`Processing order paid: ${order.id}`);
      
      const paymentRecord = await this.paymentModel.findOne({ orderId: order.id });
      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for order ID: ${order.id}`);
        return;
      }

      // Update payment record
      paymentRecord.status = 'completed';
      paymentRecord.completedAt = new Date();
      await paymentRecord.save();

      // Update reservation
      const reservation = await this.reservationModel.findById(paymentRecord.reservationId);
      if (reservation) {
        reservation.status = 'confirmed';
        reservation.paymentStatus = 'completed';
        reservation.confirmedAt = new Date();
        await reservation.save();

        this.logger.log(`Order paid for reservation: ${reservation._id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling order paid: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handlePaymentAuthorized(payment: any) {
    try {
      this.logger.log(`Processing payment authorized: ${payment.id}`);
      
      const paymentRecord = await this.paymentModel.findOne({ paymentId: payment.id });
      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for payment ID: ${payment.id}`);
        return;
      }

      // Update payment record
      paymentRecord.status = 'authorized';
      paymentRecord.authorizedAt = new Date();
      paymentRecord.razorpayPaymentId = payment.id;
      await paymentRecord.save();

      this.logger.log(`Payment authorized for reservation: ${paymentRecord.reservationId}`);
    } catch (error) {
      this.logger.error(`Error handling payment authorized: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('logs')
  async getWebhookLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('event_type') eventType?: string,
    @Query('status') status?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      if (eventType) filter.event_type = eventType;
      if (status) filter.status = status;

      const [webhooks, total] = await Promise.all([
        this.webhookModel
          .find(filter)
          .sort({ processed_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        this.webhookModel.countDocuments(filter),
      ]);

      return {
        success: true,
        data: webhooks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching webhook logs:', error);
      throw new HttpException('Failed to fetch webhook logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  async getWebhookStats() {
    try {
      const stats = await this.webhookModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            processed: { $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            received: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
            signatureVerified: { $sum: { $cond: ['$signature_verified', 1, 0] } },
            signatureFailed: { $sum: { $cond: [{ $eq: ['$signature_verified', false] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            processed: 1,
            failed: 1,
            received: 1,
            signatureVerified: 1,
            signatureFailed: 1,
            successRate: { $multiply: [{ $divide: ['$processed', '$total'] }, 100] },
          },
        },
      ]);

      const eventTypeStats = await this.webhookModel.aggregate([
        {
          $group: {
            _id: '$event_type',
            count: { $sum: 1 },
            processed: { $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        {
          $project: {
            event_type: '$_id',
            count: 1,
            processed: 1,
            failed: 1,
            successRate: { $multiply: [{ $divide: ['$processed', '$count'] }, 100] },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        data: {
          overall: stats[0] || {
            total: 0,
            processed: 0,
            failed: 0,
            received: 0,
            signatureVerified: 0,
            signatureFailed: 0,
            successRate: 0,
          },
          byEventType: eventTypeStats,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching webhook stats:', error);
      throw new HttpException('Failed to fetch webhook stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 