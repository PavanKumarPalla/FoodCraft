// src/components/CategoryCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './CategoryCard.css';

export default function CategoryCard({ category }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipes?category=${encodeURIComponent(category.title)}&filterKey=${category.filterKey}&filterVal=${encodeURIComponent(category.filterValue)}`);
  };

  return (
    <div 
      className="category-card" 
      onClick={handleClick}
      id={`cat-card-${category.id}`}
    >
      <img src={category.image} alt={category.title} className="category-bg-img" loading="lazy" />
      <div className="category-overlay"></div>

      <div className="category-content">
        <span className="category-badge">{category.badge}</span>
        <h3 className="category-title">{category.title}</h3>
        <p className="category-subtitle">{category.subtitle}</p>

        <div className="category-footer">
          <span className="category-count">{category.count}</span>
          <div className="category-arrow-circle">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
