// src/components/FilterBar.jsx
import React from 'react';
import './FilterBar.css';

const FILTER_OPTIONS = [
  { id: 'All', label: 'All Recipes' },
  { id: 'Veg', label: '🟢 Veg' },
  { id: 'Non-Veg', label: '🔴 Non-Veg' },
  { id: 'Gym', label: '💪 Gym Protein' },
  { id: 'Low Sugar', label: '🍬 Low Sugar' },
  { id: 'Low Salt', label: '🧂 Low Salt' },
  { id: 'Snacks', label: '☕ Snacks' },
  { id: 'South Indian', label: 'South Indian' },
  { id: 'North Indian', label: 'North Indian' },
  { id: 'Quick', label: '⏱️ Under 20m' }
];

export default function FilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="filter-bar-container">
      <div className="filter-scroll-track">
        {FILTER_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`filter-pill ${activeFilter === item.id ? 'active' : ''}`}
            onClick={() => onFilterChange(item.id)}
            id={`filter-btn-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
