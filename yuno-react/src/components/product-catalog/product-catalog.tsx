import React, { useState, useMemo, useCallback } from 'react';
import { ProductCard, Cart, Checkout, type Product } from './index';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Classic Polo Shirt',
    price: 49.99,
    description: 'Timeless polo shirt crafted from premium piqué cotton with ribbed collar',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop&q=80',
    category: 'Shirts',
    rating: 4.8,
    reviews: 234,
    inStock: true
  },
  {
    id: '2',
    name: 'Tailored Slim Chinos',
    price: 79.99,
    description: 'Modern slim-fit chinos with stretch comfort and clean silhouette',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop&q=80',
    category: 'Pants',
    rating: 4.7,
    reviews: 189,
    inStock: true
  },
  {
    id: '3',
    name: 'Oxford Button-Down',
    price: 69.99,
    description: 'Classic Oxford shirt with button-down collar for versatile styling',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&h=400&fit=crop&q=80',
    category: 'Shirts',
    rating: 4.9,
    reviews: 312,
    inStock: true
  },
  {
    id: '4',
    name: 'Merino Wool Sweater',
    price: 129.99,
    description: 'Luxurious merino wool sweater with fine-gauge knit construction',
    image: 'https://images.unsplash.com/photo-1620799140408-ed5341252629?w=400&h=400&fit=crop&q=80',
    category: 'Knitwear',
    rating: 4.8,
    reviews: 156,
    inStock: true
  },
  {
    id: '5',
    name: 'Premium Blazer',
    price: 249.99,
    description: 'Expertly tailored blazer with Italian wool blend and modern lapels',
    image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa317?w=400&h=400&fit=crop&q=80',
    category: 'Outerwear',
    rating: 4.9,
    reviews: 98,
    inStock: true
  },
  {
    id: '6',
    name: 'Linen Summer Shirt',
    price: 59.99,
    description: 'Breathable linen shirt perfect for warm weather occasions',
    image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&h=400&fit=crop&q=80',
    category: 'Shirts',
    rating: 4.6,
    reviews: 145,
    inStock: true
  },
  {
    id: '7',
    name: 'Structured Trench Coat',
    price: 299.99,
    description: 'Classic trench coat with water-resistant fabric and timeless design',
    image: 'https://images.unsplash.com/photo-1548624149-f321941d99d4?w=400&h=400&fit=crop&q=80',
    category: 'Outerwear',
    rating: 4.7,
    reviews: 67,
    inStock: false
  },
  {
    id: '8',
    name: 'Casual Crew Neck Tee',
    price: 34.99,
    description: 'Essential crew neck t-shirt in premium Supima cotton',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop&q=80',
    category: 'T-Shirts',
    rating: 4.5,
    reviews: 423,
    inStock: true
  },
  {
    id: '9',
    name: 'Wool Dress Pants',
    price: 149.99,
    description: 'Elegant wool-blend dress pants with pressed creases',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa002c4?w=400&h=400&fit=crop&q=80',
    category: 'Pants',
    rating: 4.8,
    reviews: 112,
    inStock: true
  },
  {
    id: '10',
    name: 'Quilted Vest',
    price: 119.99,
    description: 'Lightweight quilted vest with water-resistant finish',
    image: 'https://images.unsplash.com/photo-1617114919297-3c8ddbec014e?w=400&h=400&fit=crop&q=80',
    category: 'Outerwear',
    rating: 4.6,
    reviews: 89,
    inStock: true
  },
  {
    id: '11',
    name: 'Cashmere V-Neck',
    price: 189.99,
    description: 'Ultra-soft cashmere sweater with classic V-neck styling',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop&q=80',
    category: 'Knitwear',
    rating: 4.9,
    reviews: 78,
    inStock: true
  },
  {
    id: '12',
    name: 'Slim Fit Dress Shirt',
    price: 89.99,
    description: 'Crisp cotton dress shirt with French cuffs and spread collar',
    image: 'https://images.unsplash.com/photo-1600121110465-9830573e3432?w=400&h=400&fit=crop&q=80',
    category: 'Shirts',
    rating: 4.7,
    reviews: 265,
    inStock: true
  }
];

export const ProductCatalog: React.FC = () => {
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCheckout, setShowCheckout] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(mockProducts.map(product => product.category)));
    return ['All', ...uniqueCategories];
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  // Calculate cart totals
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Add to cart function
  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  }, []);

  // Remove from cart function
  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  // Update quantity function
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear cart function
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  }, [cart]);

  // Handle checkout completion
  const handleCheckoutComplete = useCallback(() => {
    setShowCheckout(false);
    setCart([]);
  }, []);

  return (
    <div className="catalog-container">
      {/* Header */}
      <header className="catalog-header">
        <div className="catalog-header-content">
          <div className="catalog-header-left">
            <div className="catalog-logo">Y</div>
            <h1 className="catalog-title">Yuno Store</h1>
          </div>
          <div className="catalog-header-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">
                <span>🔍</span>
              </div>
            </div>
            <div className="cart-count">
              <span>🛒</span>
              <span className="cart-count-badge">{cartItemCount}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="catalog-main">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h2 className="hero-title">Premium Collection</h2>
            <p className="hero-subtitle">
              Discover our curated selection of premium menswear. Quality craftsmanship meets modern design.
            </p>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="filters-container">
          <div className="filters-content">
            <div className="filters-left">
              {/* Category Filter */}
              <div className="filter-group">
                <label className="filter-label">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="filter-group">
                <label className="filter-label">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'rating')}
                  className="filter-select"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="filter-group">
                <label className="filter-label">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="filter-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="results-count">
              <strong>{filteredAndSortedProducts.length}</strong> product{filteredAndSortedProducts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <div className="catalog-layout">
          {/* Products Grid */}
          <div className="products-section">
            <div className="products-grid">
              {filteredAndSortedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>

            {filteredAndSortedProducts.length === 0 && (
              <div className="no-products">
                <div className="no-products-icon">🔍</div>
                <h3 className="no-products-title">No products found</h3>
                <p className="no-products-description">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="cart-sidebar">
            <Cart
              cart={cart}
              totalPrice={totalPrice}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onClearCart={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <Checkout
          cart={cart}
          totalPrice={totalPrice}
          onComplete={handleCheckoutComplete}
        />
      )}
    </div>
  );
};