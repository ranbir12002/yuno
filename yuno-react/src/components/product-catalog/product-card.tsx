import React from 'react';
import type { Product } from './types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star star-filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star star-half">☆</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star star-empty">★</span>);
    }

    return stars;
  };

  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="out-of-stock-overlay">
            <span className="out-of-stock-badge">
              Out of Stock
            </span>
          </div>
        )}
        <div className="product-category-badge">
          <span className="category-tag">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">
          {product.name}
        </h3>
        
        <p className="product-description">
          {product.description}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="product-rating">
            <div className="stars-container">
              {renderStars(product.rating)}
            </div>
            <span className="rating-text">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="product-footer">
          <div className="product-pricing">
            <span className="product-price">
              ${product.price.toFixed(2)}
            </span>
            {product.rating && (
              <span className="price-per-star">
                ${(product.price / 5).toFixed(2)} per star
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`add-to-cart-btn ${!product.inStock ? 'add-to-cart-btn-disabled' : ''}`}
          >
            {product.inStock ? (
              <span className="add-to-cart-content">
                <span className="cart-icon">🛒</span>
                Add to Cart
              </span>
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};