import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendOtpEmail(email: string, otp: string, firstName?: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Your Events Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Events</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your login verification code</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName || 'there'}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                You requested a login verification code for your Events account. Use the code below to complete your login:
              </p>
              <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                <strong>This code will expire in 10 minutes.</strong>
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                If you didn't request this code, please ignore this email. Your account security is important to us.
              </p>
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from Events. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      console.log(`[EMAIL] OTP sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send OTP to ${email}:`, error);
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, firstName?: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset Your Events Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Events</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName || 'there'}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                You requested to reset your password for your Events account. Use the verification code below to set a new password:
              </p>
              <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                <strong>This code will expire in 10 minutes.</strong>
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from Events. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      console.log(`[EMAIL] Password reset OTP sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send password reset OTP to ${email}:`, error);
      console.log(`[DEV] Password reset OTP for ${email}: ${otp}`);
    }
  }

  async sendBookingConfirmationEmail(
    email: string,
    firstName: string,
    bookingData: {
      bookingCode: string;
      spaceName: string;
      spaceAddress: string;
      startTime: string;
      endTime: string;
      totalAmount: number;
      pricingBreakdown?: Array<{
        type: string;
        description: string;
        amount: number;
      }>;
    },
    icsAttachment?: { ics: string; filename: string }
  ): Promise<void> {
    try {
      const startDate = new Date(bookingData.startTime);
      const endDate = new Date(bookingData.endTime);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

      const emailOptions: any = {
        from: 'onboarding@resend.dev',
        to: email,
        subject: `Booking Confirmed - ${bookingData.spaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Events</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Booking Confirmation</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Your booking has been successfully confirmed! Here are the details:
              </p>
              
              <!-- Booking Code -->
              <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 10px 0;">Your Booking Code</h3>
                <div style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                  ${bookingData.bookingCode}
                </div>
                <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">Show this code at check-in</p>
              </div>

              <!-- Booking Details -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Booking Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <strong style="color: #333;">Space:</strong><br>
                    <span style="color: #666;">${bookingData.spaceName}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Address:</strong><br>
                    <span style="color: #666;">${bookingData.spaceAddress}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Date:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Time:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Duration:</strong><br>
                    <span style="color: #666;">${duration} hours</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Total Amount:</strong><br>
                    <span style="color: #667eea; font-weight: bold;">₹${bookingData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Price Breakdown -->
              ${bookingData.pricingBreakdown ? `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">Price Breakdown</h3>
                  <div style="font-size: 14px;">
                    ${bookingData.pricingBreakdown.map(item => `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #666;">${item.description}</span>
                        <span style="color: ${item.amount < 0 ? '#28a745' : '#333'}; font-weight: ${item.amount < 0 ? 'normal' : 'bold'};">₹${item.amount.toFixed(2)}</span>
                      </div>
                    `).join('')}
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                      <span style="color: #333;">Total</span>
                      <span style="color: #667eea;">₹${bookingData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Check-in Instructions -->
              <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Check-in Instructions</h3>
                <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Arrive 10 minutes before your scheduled time</li>
                  <li>Bring a valid ID and your booking code</li>
                  <li>Check-in with the staff at the venue</li>
                  <li>Follow the venue's rules and guidelines</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Need Help?</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">
                  If you have any questions about your booking, please contact us:<br>
                  <strong>Email:</strong> support@events.live<br>
                  <strong>Phone:</strong> +91 98765 43210<br>
                  <strong>Booking Code:</strong> ${bookingData.bookingCode}
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from Events. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      };
      if (icsAttachment) {
        emailOptions.attachments = [
          {
            filename: icsAttachment.filename,
            content: icsAttachment.ics,
            contentType: 'text/calendar',
          },
        ];
      }
      await this.resend.emails.send(emailOptions);
      console.log(`[EMAIL] Booking confirmation sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send booking confirmation to ${email}:`, error);
    }
  }

  async sendPaymentFailureEmail(
    email: string,
    firstName: string,
    bookingData: {
      bookingCode: string;
      spaceName: string;
      spaceAddress: string;
      startTime: string;
      endTime: string;
      totalAmount: number;
    }
  ): Promise<void> {
    try {
      const startDate = new Date(bookingData.startTime);
      const endDate = new Date(bookingData.endTime);

      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: `Payment Failed - ${bookingData.spaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Events</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Payment Failed</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                We're sorry, but your payment for the following booking has failed. Please try again to complete your reservation:
              </p>
              
              <!-- Booking Details -->
              <div style="background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Booking Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <strong style="color: #333;">Space:</strong><br>
                    <span style="color: #666;">${bookingData.spaceName}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Address:</strong><br>
                    <span style="color: #666;">${bookingData.spaceAddress}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Date:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Time:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Booking Code:</strong><br>
                    <span style="color: #dc3545; font-weight: bold; font-family: 'Courier New', monospace;">${bookingData.bookingCode}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Amount:</strong><br>
                    <span style="color: #dc3545; font-weight: bold;">₹${bookingData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Action Required -->
              <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">What to do next?</h3>
                <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Check your payment method and ensure sufficient funds</li>
                  <li>Try using a different payment method</li>
                  <li>Contact your bank if there are any issues</li>
                  <li>Visit your dashboard to retry the payment</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Need Help?</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">
                  If you continue to experience issues, please contact us:<br>
                  <strong>Email:</strong> support@events.live<br>
                  <strong>Phone:</strong> +91 98765 43210<br>
                  <strong>Booking Code:</strong> ${bookingData.bookingCode}
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from Events. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      console.log(`[EMAIL] Payment failure notification sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send payment failure notification to ${email}:`, error);
    }
  }

  async sendRefundConfirmationEmail(
    email: string,
    firstName: string,
    bookingData: {
      bookingCode: string;
      spaceName: string;
      spaceAddress: string;
      startTime: string;
      endTime: string;
      refundAmount: number;
      refundReason: string;
    }
  ): Promise<void> {
    try {
      const startDate = new Date(bookingData.startTime);
      const endDate = new Date(bookingData.endTime);

      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: `Refund Processed - ${bookingData.spaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Events</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Refund Confirmation</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Your refund has been successfully processed. Here are the details:
              </p>
              
              <!-- Refund Details -->
              <div style="background: #f0fff4; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Refund Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <strong style="color: #333;">Refund Amount:</strong><br>
                    <span style="color: #28a745; font-weight: bold; font-size: 18px;">₹${bookingData.refundAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Reason:</strong><br>
                    <span style="color: #666;">${bookingData.refundReason}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Booking Code:</strong><br>
                    <span style="color: #28a745; font-weight: bold; font-family: 'Courier New', monospace;">${bookingData.bookingCode}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Space:</strong><br>
                    <span style="color: #666;">${bookingData.spaceName}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Date:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <strong style="color: #333;">Time:</strong><br>
                    <span style="color: #666;">${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <!-- Refund Timeline -->
              <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Refund Timeline</h3>
                <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                  <li><strong>UPI:</strong> 24-48 hours</li>
                  <li><strong>Net Banking:</strong> 3-5 business days</li>
                  <li><strong>Wallets:</strong> Instant to 24 hours</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Need Help?</h3>
                <p style="color: #666; line-height: 1.6; margin: 0;">
                  If you have any questions about your refund, please contact us:<br>
                  <strong>Email:</strong> support@events.live<br>
                  <strong>Phone:</strong> +91 98765 43210<br>
                  <strong>Booking Code:</strong> ${bookingData.bookingCode}
                </p>
              </div>

              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated message from Events. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      console.log(`[EMAIL] Refund confirmation sent successfully to ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send refund confirmation to ${email}:`, error);
    }
  }
} 