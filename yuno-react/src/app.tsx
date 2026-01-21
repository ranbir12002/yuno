import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppContext } from './context/app-context'
import { useRef, useEffect, useState } from 'react'
import { loadScript } from '@yuno-payments/sdk-web'
import type { YunoInstance } from '@yuno-payments/sdk-web-types'

export const App = () => {
  const instanceFlag = useRef(0)
  const [yunoInstance, setYunoInstance] = useState<YunoInstance | null>(null)
  const [publicApiKey, setPublicApiKey] = useState<string>('')
  const [checkoutSession, setCheckoutSession] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get public API key from backend
        const apiKeyResponse = await fetch('/api/public-api-key')
        const { publicApiKey: apiKey } = await apiKeyResponse.json()
        setPublicApiKey(apiKey)

        // Create checkout session
        const sessionResponse = await fetch('/api/checkout/sessions?country=CO', {
          method: 'POST'
        })
        const sessionData = await sessionResponse.json()
        setCheckoutSession(sessionData.checkout_session)

        // Initialize Yuno SDK
        const yuno = await loadScript({ env: 'sandbox' }) // Use 'prod' for production
        const yunoInstance = await yuno.initialize(apiKey)
        setYunoInstance(yunoInstance)
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setLoading(false)
      }
    }

    if(instanceFlag.current === 0){
      initializeApp()
      instanceFlag.current = 1
    }
  },[])

  if(loading || !yunoInstance || !publicApiKey || !checkoutSession){
    return <div>Loading...</div>
  }

  return <AppContext.Provider value={{ checkoutSession, yunoInstance, countryCode: 'CO' }}>
    <RouterProvider router={router} />
  </AppContext.Provider>
}