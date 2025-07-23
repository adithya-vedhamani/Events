import { Controller, Post, Body, Param, UseGuards, Request, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  async initializePayment(@Body() body: { reservationId: string; amount: number }) {
    try {
      return await this.paymentsService.initializePayment(body.reservationId, body.amount);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize payment',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONSUMER)
  async verifyPayment(
    @Body() body: {
      reservationId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ) {
    try {
      return await this.paymentsService.verifyPayment(
        body.reservationId,
        body.razorpay_payment_id,
        body.razorpay_order_id,
        body.razorpay_signature,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Payment verification failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('refund/:reservationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_OWNER)
  async processRefund(
    @Param('reservationId') reservationId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    try {
      return await this.paymentsService.processRefund(reservationId, body.amount, body.reason);
    } catch (error) {
      throw new HttpException(
        error.message || 'Refund processing failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('x-razorpay-signature') signature: string) {
    try {
      return await this.paymentsService.handleWebhook(body, signature);
    } catch (error) {
      console.error('Webhook error:', error);
      throw new HttpException(
        error.message || 'Webhook processing failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('history/:reservationId')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(@Param('reservationId') reservationId: string) {
    try {
      return await this.paymentsService.getPaymentHistory(reservationId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get payment history',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
} 