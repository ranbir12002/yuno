const express = require('express')
const path = require('path')
const fetch = require('node-fetch')
const v4 = require('uuid').v4
const { getCountryData } = require('./utils')
const open = require('open')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const cors = require('cors')

require('dotenv').config()

// Configuration
const SERVER_PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'
let API_URL
let CUSTOMER_ID

// Environment variables validation
const ACCOUNT_CODE = process.env.ACCOUNT_CODE
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY
const PRIVATE_SECRET_KEY = process.env.PRIVATE_SECRET_KEY

if (!ACCOUNT_CODE || !PUBLIC_API_KEY || !PRIVATE_SECRET_KEY) {
  console.error('Missing required environment variables: ACCOUNT_CODE, PUBLIC_API_KEY, PRIVATE_SECRET_KEY')
  process.exit(1)
}

// Paths
const reactBuildDirectory = path.join(__dirname, 'yuno-react', 'dist')

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Payment rate limiting (more restrictive)
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 payment requests per 5 minutes
  message: 'Too many payment attempts, please try again later.',
})

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://api-sandbox.y.uno", "https://api.y.uno"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api-sandbox.y.uno", "https://api.y.uno"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}))

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.static(reactBuildDirectory))

// Apply rate limiting
app.use('/api', limiter)
app.use('/api/payments', paymentLimiter)

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const ip = req.ip || req.connection.remoteAddress
  
  if (NODE_ENV === 'development') {
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`)
  }
  
  next()
})

// Input validation middleware
const validateCheckoutSession = (req, res, next) => {
  const { amount, items } = req.body
  
  // Validate amount
  if (amount && (typeof amount !== 'number' || amount <= 0 || amount > 1000000)) {
    return res.status(400).json({
      error: 'Invalid amount',
      message: 'Amount must be a positive number between 0.01 and 10,000.00'
    })
  }
  
  // Validate items
  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (!item.id || !item.name || !item.quantity || !item.unit_amount) {
        return res.status(400).json({
          error: 'Invalid item data',
          message: 'Each item must have id, name, quantity, and unit_amount'
        })
      }
      if (item.quantity <= 0 || item.unit_amount <= 0) {
        return res.status(400).json({
          error: 'Invalid item values',
          message: 'Quantity and unit_amount must be positive numbers'
        })
      }
    }
  }
  
  next()
}

const validatePayment = (req, res, next) => {
  const { checkoutSession, oneTimeToken, amount } = req.body
  
  if (!checkoutSession || !oneTimeToken) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'checkoutSession and oneTimeToken are required'
    })
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(checkoutSession)) {
    return res.status(400).json({
      error: 'Invalid checkout session format',
      message: 'Checkout session must be a valid UUID v4'
    })
  }
  
  if (amount && (typeof amount !== 'number' || amount <= 0)) {
    return res.status(400).json({
      error: 'Invalid amount',
      message: 'Amount must be a positive number'
    })
  }
  
  next()
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString()
  
  if (NODE_ENV === 'development') {
    console.error(`[${timestamp}] Error:`, err)
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : err.message,
    timestamp
  })
}

// Health check endpoint
app.get('/sdk-web/healthy', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  })
})

// Public API key endpoint
app.get('/public-api-key', (req, res) => {
  res.json({ 
    publicApiKey: PUBLIC_API_KEY,
    environment: NODE_ENV === 'production' ? 'production' : 'sandbox'
  })
})

// Checkout session creation
app.post('/checkout/sessions', validateCheckoutSession, async (req, res) => {
  try {
  const country = req.query.country || 'CO'
  const { currency } = getCountryData(country)

    // Get amount and items from request body, or use defaults
    const { amount, items } = req.body
    const orderAmount = amount ? Math.round(amount) : 2000 // Convert to cents
    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    
    // Create payment description from items if available
    let paymentDescription = 'E-commerce Purchase'
    if (items && items.length > 0) {
      paymentDescription = `Purchase: ${items.map(item => item.name).join(', ')}`
    }

  const response = await fetch(
    `${API_URL}/v1/checkout/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
          merchant_order_id: orderId,
          payment_description: paymentDescription,
        country,
        customer_id: CUSTOMER_ID,
        amount: {
            currency: currency || 'USD',
            value: orderAmount,
          },
          additional_data: items ? {
            order: {
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit_amount: item.unit_amount,
                category: 'general'
              }))
            }
          } : undefined
        }),
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      return res.status(400).json({
        error: 'Failed to create checkout session',
        details: responseData
      });
    }

    // Ensure we return the correct session format
    const sessionId = responseData.checkout_session || 
                     responseData.id || 
                     responseData.session_id || 
                     responseData.uuid;
    
    res.json({
      checkout_session: sessionId,
      merchant_order_id: orderId,
      country: country,
      payment_description: paymentDescription,
      customer_id: CUSTOMER_ID,
      amount: orderAmount,
      currency: currency || 'USD'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
})

// Payment processing
app.post('/payments', validatePayment, async (req, res) => {
  try {
  const checkoutSession = req.body.checkoutSession
  const oneTimeToken = req.body.oneTimeToken
    const amount = req.body.amount || 2000 // Amount in cents
  const country = req.query.country || 'CO'
    const { currency, documentNumber, documentType } = getCountryData(country)

  const response = await fetch(`${API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'public-api-key': PUBLIC_API_KEY,
      'private-secret-key': PRIVATE_SECRET_KEY,
      'X-idempotency-key': v4(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        description: 'E-commerce Purchase',
      account_id: ACCOUNT_CODE,
        merchant_order_id: `PAYMENT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      country,
      additional_data: {
          order: {
            fee_amount: 0,
            items: [
              {
                brand: 'Store',
                category: 'General',
                id: 'ITEM_001',
                manufacture_part_number: 'STORE_001',
                name: 'E-commerce Purchase',
                quantity: 1,
                sku_code: 'STORE_001',
                unit_amount: amount / 100, // Convert back to dollars
              },
            ],
            shipping_amount: 0,
        },
      },
      amount: {
          currency: currency || 'USD',
        value: amount,
      },
      checkout: {
        session: checkoutSession,
      },
      customer_payer: {
        billing_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
          country,
          state: 'Cundinamarca',
          zip_code: '111111',
            neighborhood: null
        },
        date_of_birth: '1990-02-28',
        device_fingerprint: 'hi88287gbd8d7d782ge....',
        document: {
          document_type: documentType,
          document_number: documentNumber,
        },
          email: 'customer@example.com',
          first_name: 'John',
        gender: 'MALE',
        id: CUSTOMER_ID,
        ip_address: '192.168.123.167',
          last_name: 'Doe',
          merchant_customer_id: 'customer_001',
        nationality: country,
        phone: {
          country_code: '57',
          number: '3132450765',
        },
        shipping_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
          country,
          state: 'Cundinamarca',
          zip_code: '111111',
            neighborhood: null
          },
      },
      payment_method: {
        token: oneTimeToken,
        vaulted_token: null,
      },
    }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      return res.status(400).json({
        error: 'Payment failed',
        details: responseData
      });
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
})

// Customer session creation
app.post('/customers/sessions', async (req, res) => {
  try {
  const country = req.query.country || 'CO'

  const response = await fetch(
    `${API_URL}/v1/customers/sessions`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "account_id": ACCOUNT_CODE,
        country,
      }),
    }
  )
    const customerSession = await response.json()
    res.json(customerSession)
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
})

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(reactBuildDirectory, 'index.html'))
})

// Error handling middleware (must be last)
app.use(errorHandler)

// API URL generation
const ApiKeyPrefixToEnvironmentSuffix = {
  dev: '-dev',
  staging: '-staging',
  sandbox: '-sandbox',
  prod: '',
}

const baseAPIurl = 'https://api_ENVIRONMENT_.y.uno'

function generateBaseUrlApi() {
  const [apiKeyPrefix] = PUBLIC_API_KEY.split('_')
  let baseURL = ''
  const environmentSuffix = ApiKeyPrefixToEnvironmentSuffix[apiKeyPrefix]
  baseURL = baseAPIurl.replace('_ENVIRONMENT_', environmentSuffix)

  return baseURL
}

// Customer creation
function createCustomer() {
  const response = fetch(
    `${API_URL}/v1/customers`,
    {
      method: 'POST',
      headers: {
        'public-api-key': PUBLIC_API_KEY,
        'private-secret-key': PRIVATE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: ACCOUNT_CODE,
        merchant_customer_id: 'customer_001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'customer@example.com',
        phone: {
          country_code: '57',
          number: '3132450765',
        },
        document: {
          document_type: 'CC',
          document_number: '1032765432',
        },
        billing_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
          country: 'CO',
          state: 'Cundinamarca',
          zip_code: '111111',
        },
        shipping_address: {
          address_line_1: 'Calle 34 # 56 - 78',
          address_line_2: 'Apartamento 502, Torre I',
          city: 'Bogota',
        country: 'CO',
          state: 'Cundinamarca',
          zip_code: '111111',
        },
      }),
    }
  )
  return response.then((resp) => resp.json())
}

// Server startup
app.listen(SERVER_PORT, async () => {
  try {
    API_URL = generateBaseUrlApi()
    CUSTOMER_ID = await createCustomer().then(({ id }) => id)

    console.log(`🚀 Server started successfully!`)
    console.log(`📱 React app: http://localhost:${SERVER_PORT}`)
    console.log(`🌍 Environment: ${NODE_ENV}`)
    console.log(`🔑 API URL: ${API_URL}`)
    
    if (NODE_ENV === 'development') {
      await open(`http://localhost:${SERVER_PORT}`)
    }
  } catch (error) {
    console.error('  Failed to start server:', error.message)
    process.exit(1)
  }
})