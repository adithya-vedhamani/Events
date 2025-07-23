import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ required: true })
  webhook_id: string;

  @Prop({ required: true })
  event_type: string;

  @Prop({ required: true })
  processed_at: Date;

  @Prop({ type: Object })
  payload_summary: {
    payment_id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    [key: string]: any;
  };

  @Prop({ default: 'received' })
  status: 'received' | 'processed' | 'failed';

  @Prop()
  error_message?: string;

  @Prop()
  signature_verified: boolean;

  @Prop()
  processing_time_ms?: number;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook); 