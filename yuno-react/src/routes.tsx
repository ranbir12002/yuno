import { createBrowserRouter } from "react-router-dom"
import { ProductCatalog } from "./components/product-catalog"

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProductCatalog />,
  },
  {
    path: '*',
    element: <ProductCatalog />,
  },
])
