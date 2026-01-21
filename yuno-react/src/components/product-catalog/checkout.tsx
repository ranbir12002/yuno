import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../context/app-context';
import type { CartItem, PaymentResult } from './types';

interface CheckoutProps {
  cart: CartItem[];
  totalPrice: number;
  onComplete: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  cart,
  totalPrice,
  onComplete
}) => {
  const { yunoInstance } = useContext(AppContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<string>('');
  const [isYunoMounted, setIsYunoMounted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const paymentContainerRef = useRef<HTMLDivElement>(null);

  // Create checkout session and immediately mount Yuno when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsInitializing(true);
        
        if (!yunoInstance) {
          setPaymentMessage('  Payment system not available. Please refresh the page.');
          setShowFailureModal(true);
          return;
        }

        // Create checkout session
        const sessionResponse = await fetch('/api/checkout/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalPrice * 100, // Convert to cents
            currency: 'USD',
            items: cart.map(item => ({
              id: item.product.id,
              name: item.product.name,
              quantity: item.quantity,
              unit_amount: item.product.price * 100
            }))
          })
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          throw new Error(errorData.message || 'Failed to create checkout session');
        }

        const sessionData = await sessionResponse.json();
        setCheckoutSession(sessionData.checkout_session);

        // Wait a bit for the DOM to be ready
        setTimeout(async () => {
          await mountYunoCheckout(sessionData.checkout_session);
        }, 100);
      } catch (error) {
        setPaymentMessage(`  Failed to initialize payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setShowFailureModal(true);
      } finally {
        setIsInitializing(false);
      }
    };

    // Only initialize if we have a Yuno instance
    if (yunoInstance) {
      initializePayment();
    }
  }, [cart, totalPrice, yunoInstance]);

  const mountYunoCheckout = async (session: string) => {
    if (!yunoInstance) {
      return;
    }

    try {
      // Create a completely isolated container for Yuno
      let yunoContainer = document.getElementById('yuno-payment-container');
      if (!yunoContainer) {
        // Create a new container that React will never touch
        yunoContainer = document.createElement('div');
        yunoContainer.id = 'yuno-payment-container';
        yunoContainer.style.width = '100%';
        
        // Insert it into the React container
        const reactContainer = document.getElementById('payment-container');
        if (reactContainer) {
          reactContainer.appendChild(yunoContainer);
        }
      } else {
        // Clear existing content
        yunoContainer.innerHTML = '';
      }

      setIsYunoMounted(false);
      
      // Start checkout with the isolated container
      await yunoInstance.startCheckout({
        checkoutSession: session,
        elementSelector: '#yuno-payment-container',
        countryCode: 'CO',
        language: 'en',
        showLoading: true,
        yunoCreatePayment: async (oneTimeToken: string) => {
          // Use the session parameter directly to avoid state issues
          await processPayment(oneTimeToken, session);
        },
        yunoError: () => {
          setPaymentMessage('  Payment failed. Please try again.');
          setShowFailureModal(true);
          setIsProcessing(false);
        },
        onRendered: () => {
          setIsYunoMounted(true);
        },
        onOneTimeTokenCreationStart: () => {
          // Token creation started
        }
      });

      // Mount card payment method
      try {
        await yunoInstance.mountCheckout({
          paymentMethodType: 'CARD'
        });
        
        // Check if form is visible after a short delay
        setTimeout(() => {
          if (yunoContainer && yunoContainer.children.length > 0) {
            setIsYunoMounted(true);
          }
        }, 2000);
        
      } catch (mountError) {
        // Error mounting card payment
      }
      
    } catch (error) {
      setPaymentMessage('  Failed to initialize payment form. Please try again.');
      setShowFailureModal(true);
    }
  };

  const processPayment = async (oneTimeToken: string, sessionId?: string) => {
    try {
      setIsProcessing(true);
      
      // Use the passed sessionId or fall back to state
      const sessionToUse = sessionId || checkoutSession;
      
      if (!sessionToUse) {
        setPaymentMessage('  Payment session expired. Please try again.');
        setShowFailureModal(true);
        return;
      }
      
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutSession: sessionToUse,
          oneTimeToken: oneTimeToken,
          amount: totalPrice * 100
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        setPaymentMessage(`  Payment failed: ${errorData.message || 'Unknown error'}`);
        setShowFailureModal(true);
        return;
      }

      const paymentResult: PaymentResult = await paymentResponse.json();
      
      // Check for successful payment based on Yuno API response format
      if (paymentResult.status === 'SUCCEEDED' && paymentResult.sub_status === 'APPROVED') {
        setPaymentMessage('🎉 Payment successful! Thank you for your purchase.');
        setShowSuccessModal(true);
      } else if (paymentResult.status === 'SUCCEEDED' && paymentResult.sub_status === 'PENDING') {
        setPaymentMessage('⏳ Payment is being processed. Please wait...');
        setShowSuccessModal(true);
      } else if (paymentResult.requiresAction) {
        // Check if we need to continue payment (e.g., 3D Secure)
        yunoInstance.continuePayment();
      } else {
        setPaymentMessage('  Payment failed. Please try again.');
        setShowFailureModal(true);
      }
    } catch (error) {
      setPaymentMessage('  Payment processing failed. Please try again.');
      setShowFailureModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartPayment = () => {
    if (!isYunoMounted) {
      setPaymentMessage('  Payment form is not ready. Please wait a moment.');
      setShowFailureModal(true);
      return;
    }

    setIsProcessing(true);
    yunoInstance.startPayment();
  };


  // Cleanup function
  useEffect(() => {
    return () => {
      const yunoContainer = document.getElementById('yuno-payment-container');
      if (yunoContainer) {
        yunoContainer.remove();
      }
    };
  }, []);

  return (
    <>
      {/* Modal Overlay */}
      <div className="checkout-modal-overlay">
        <div className="checkout-modal">
          {/* Header */}
          <div className="checkout-header">
            <h2 className="checkout-title">Secure Checkout</h2>
            <button
              onClick={onComplete}
              className="checkout-close-btn"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="checkout-content">
            {/* Order Summary */}
            <div className="order-summary">
              <h3 className="order-summary-title">Order Summary</h3>
              <div className="order-items">
                {cart.map((item) => (
                  <div key={item.product.id} className="order-item">
                    <div className="order-item-info">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="order-item-image"
                      />
                      <div className="order-item-details">
                        <h4 className="order-item-name">{item.product.name}</h4>
                        <p className="order-item-quantity">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="order-item-price">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <div className="order-total-row">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="payment-section">
              <h3 className="payment-title">Payment Information</h3>
              
              {isInitializing ? (
                <div className="payment-loading">
                  <div className="spinner"></div>
                  <p className="loading-text">Initializing payment form...</p>
                </div>
              ) : (
                <div className="payment-form-container">
                  <div
                    id="payment-container"
                    ref={paymentContainerRef}
                    className="payment-container"
                  >
                    {!isYunoMounted && (
                      <div className="payment-form-loading">
                        <div className="spinner"></div>
                        <p className="loading-text">Loading payment form...</p>
                      </div>
                    )}
                  </div>
                  
                  {isYunoMounted && (
                    <button
                      onClick={handleStartPayment}
                      disabled={isProcessing}
                      className={`payment-btn ${isProcessing ? 'payment-btn-disabled' : ''}`}
                    >
                      {isProcessing ? (
                        <span className="payment-btn-content">
                          <div className="spinner-small"></div>
                          Processing Payment...
                        </span>
                      ) : (
                        `Pay $${totalPrice.toFixed(2)}`
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="security-notice">
              <div className="security-content">
                <span className="security-icon">🔒</span>
                <div className="security-text">
                  <p className="security-title">Secure Payment</p>
                  <p className="security-description">Your payment information is encrypted and secure. We never store your card details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="modal-content">
              <div className="modal-icon">✅</div>
              <h3 className="modal-title">Payment Successful!</h3>
              <p className="modal-message">{paymentMessage}</p>
              <button
                onClick={onComplete}
                className="modal-btn success-btn"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="modal-overlay">
          <div className="modal failure-modal">
            <div className="modal-content">
              <div className="modal-icon"> </div>
              <h3 className="modal-title">Payment Failed</h3>
              <p className="modal-message">{paymentMessage}</p>
              <button
                onClick={onComplete}
                className="modal-btn close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
