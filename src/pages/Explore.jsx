// src/pages/Explore.jsx
import React from 'react';
import { Compass, Utensils, Flame, HeartHandshake } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import { CATEGORIES } from '../data/mockData';
import './Explore.css';

export default function Explore() {
  const regionalCategories = CATEGORIES.filter(c => c.badge === 'Regional');
  const dietaryCategories = CATEGORIES.filter(c => c.badge === 'Diet' || c.badge === 'Fitness');
  const healthCategories = CATEGORIES.filter(c => c.badge === 'Health' || c.badge === 'Quick');

  return (
    <div className="explore-page page-wrapper">
      {/* Header */}
      <div className="explore-header animate-fade-in">
        <div className="explore-badge">
          <Compass size={15} />
          <span>Global Cuisines & Specialized Diets</span>
        </div>
        <h1 className="explore-title">Explore Culinary Universes</h1>
        <p className="explore-subtitle">
          Browse through authentic regional cuisines, fitness-focused high protein meals, diabetic-friendly dishes, and quick evening snacks.
        </p>
      </div>

      {/* Section 1: Regional Cuisines */}
      <section className="explore-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Utensils size={20} className="text-primary" />
              <span>Authentic Regional Cuisines</span>
            </h2>
            <p className="section-subtitle">Traditional heritage recipes with exact spice measurements</p>
          </div>
        </div>
        <div className="categories-grid">
          {regionalCategories.map(cat => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Section 2: Fitness & Diet Goals */}
      <section className="explore-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <Flame size={20} className="text-flame" />
              <span>Diets & Fitness Focus</span>
            </h2>
            <p className="section-subtitle">High protein, vegetarian, and nutrient-dense options</p>
          </div>
        </div>
        <div className="categories-grid">
          {dietaryCategories.map(cat => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Section 3: Specialized Health & Quick Bites */}
      <section className="explore-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <HeartHandshake size={20} className="text-veg" />
              <span>Specialized Health & Fast Cooking</span>
            </h2>
            <p className="section-subtitle">Low sodium cardio care, glycemic control, and 15-min chai snacks</p>
          </div>
        </div>
        <div className="categories-grid">
          {healthCategories.map(cat => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>
    </div>
  );
}
