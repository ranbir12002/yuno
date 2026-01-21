export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  rating?: number;
  reviews?: number;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentResult {
  status: string;
  sub_status: string;
  id?: string;
  amount?: {
    value: number;
    currency: string;
  };
  requiresAction?: boolean;
}

export interface CheckoutSession {
  checkout_session: string;
  merchant_order_id: string;
  country: string;
  payment_description: string;
  customer_id: string;
  amount: number;
  currency: string;
}