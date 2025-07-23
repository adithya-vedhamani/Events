declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve();
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export function createRazorpayOrder(options: RazorpayOptions) {
  return new Promise((resolve, reject) => {
    loadRazorpayScript().then(() => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay not loaded'));
        return;
      }

      const rzp = new window.Razorpay({
        ...options,
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      });

      rzp.on('payment.failed', (response: any) => {
        reject(new Error('Payment failed'));
      });

      rzp.open();
      resolve(rzp);
    });
  });
} 