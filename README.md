# 💳 Yuno SDK FULL Integration Demo

A comprehensive demonstration of end-to-end credit card payment processing using Yuno's SDK FULL for technical assessment purposes. This project showcases the complete payment flow from frontend checkout to backend processing and Yuno API integration.

## 🏗 Project Overview

This demo implements a complete e-commerce payment solution using Yuno's SDK FULL, featuring:

- **Frontend**: React-based checkout page with Yuno SDK integration
- **Backend**: Express.js server handling payment processing
- **Yuno SDK FULL**: Secure tokenization and payment form rendering
- **Yuno API**: Test Gateway for payment processing
- **Yuno Dashboard**: Transaction monitoring and logging

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Checkout Page │    │  Yuno SDK FULL  │    │  Yuno API       │
│   (Frontend)    │◄──►│  (Tokenization) │◄──►│  (Test Gateway) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Backend Server │    │  Secure Tokens  │    │ Yuno Dashboard  │
│   (Express.js)  │    │  (Browser Only) │    │  (Monitoring)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
yuno-sdk-web/
├── package.json                    # Root package with dev scripts
├── server.js                       # Express.js server with Yuno API integration
├── utils.js                        # Utility functions for country data
├── .env                            # Environment variables (create this)
└── yuno-react/                     # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── product-catalog/    # E-commerce components
    │   │   │   ├── checkout.tsx    # Checkout modal with Yuno SDK
    │   │   │   ├── cart.tsx        # Shopping cart
    │   │   │   └── product-catalog.tsx
    │   │   └── apm-lite-custom-loader/  # Yuno SDK loader
    │   ├── context/
    │   │   └── app-context.ts      # React context for state
    │   ├── app.tsx                 # Main app component
    │   └── main.tsx                # App entry point
    ├── package.json                # Frontend dependencies
    └── dist/                       # Built React app (generated)
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Yuno Account** with sandbox API credentials

### 1. Clone the Repository

```bash
git clone https://github.com/ranbir12002/yuno.git
cd yuno-sdk-web
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd yuno-react
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Required Yuno API credentials
ACCOUNT_CODE=your_account_code_here
PUBLIC_API_KEY=your_public_api_key_here
PRIVATE_SECRET_KEY=your_private_secret_key_here

# Optional environment settings
NODE_ENV=development
PORT=8080
```

### 4. Start the Application

```bash
# Start backend server
npm start

# In a new terminal, start frontend dev server
cd yuno-react
npm run dev
```

This will start:
- **Backend server**: http://localhost:8080
- **Frontend development**: http://localhost:5173

## 🧪 How to Run Demo

### Access the Application

1. **Open your browser** and navigate to: http://localhost:5173
2. **Browse products** in the catalog
3. **Add items to cart** and click "Proceed to Checkout"
4. **Enter payment details** using the test card numbers below

### Test Card Numbers

#### ✅ Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry Date: 12/28
CVV: 123
```

#### ❌ Failed Payment
```
Card Number: 5252 4400 0000 0010
Expiry Date: 11/28
CVV: 123
```

### Expected Results

- **Frontend**: Success/failure modal will display the payment result
- **Yuno Dashboard**: Transaction will be logged with success ✓ or failure ✗ status
- **Backend Logs**: Payment processing details in server console

## 🔄 End-to-End Flow Explanation

The complete payment flow follows these steps:

### 1. Customer Enters Card Details
- Customer fills out the payment form on the checkout page
- Card details are entered into Yuno's secure payment form

### 2. Yuno SDK Creates Secure Token
- Yuno SDK FULL tokenizes the card data in the browser
- Sensitive card information never leaves the customer's device
- A secure one-time token is generated

### 3. Backend Receives Token + Amount
- Frontend sends the token and payment amount to the backend
- Backend validates the request and prepares for Yuno API call

### 4. Backend Calls Yuno API
- Backend makes authenticated request to Yuno Test Gateway
- Uses private API key for secure communication
- Sends payment details and customer information

### 5. Yuno Dashboard Logs Payment
- Yuno Dashboard records the transaction attempt
- Shows success ✓ or failure ✗ status
- Provides detailed transaction logs

### 6. API Returns Result to Backend
- Yuno API sends payment result back to backend
- Includes transaction ID, status, and any error details

### 7. Checkout Page Shows Result
- Backend forwards result to frontend
- Success or failure modal displays to customer
- Transaction is complete

## 🛠 Development Scripts

```bash
# Start backend server
npm start

# Start frontend dev server
cd yuno-react && npm run dev

# Build React app for production
cd yuno-react && npm run build
```

## 🔐 Security Features

- **Tokenization**: Card data is tokenized by Yuno SDK, never stored
- **HTTPS**: Secure communication with Yuno API
- **Rate Limiting**: API request throttling to prevent abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Secure cross-origin resource sharing
- **Environment Variables**: Secure credential management

## 📚 API Endpoints

### Backend Endpoints

- `GET /public-api-key` - Retrieve Yuno public API key
- `POST /checkout/sessions` - Create checkout session
- `POST /payments` - Process payment with token
- `POST /customers/sessions` - Create customer session

---

**Built with ❤ using React, Express.js, and Yuno SDK FULL**

*This demo showcases the complete integration of Yuno's payment processing capabilities in a modern web application architecture.*
