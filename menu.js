// =============================================
// menu.js — Menu page functionality
// =============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allItems = [];
let activeCategory = 'All';

const categoryEmoji = {
  'Coffee':  '☕',
  'Tea':     '🍵',
  'Food':    '🥗',
  'Pastries':'🥐',
  'Drinks':  '🧃',
};

// ── Fetch menu items from Supabase ──
async function loadMenu() {
  const grid  = document.getElementById('menu-grid');
  const cats  = document.getElementById('categories');

  // Show skeleton loaders
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="card menu-card">
      <div class="skeleton" style="height:180px;"></div>
      <div style="padding:1.2rem;">
        <div class="skeleton" style="height:12px;width:60px;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:20px;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px;margin-bottom:4px;"></div>
        <div class="skeleton" style="height:14px;width:70%;"></div>
      </div>
    </div>
  `).join('');

  const { data, error } = await db.from('menu_items').select('*').order('category').order('name');
  if (error) {
    grid.innerHTML = `<p style="color:var(--accent);grid-column:1/-1">Failed to load menu. Please try again.</p>`;
    return;
  }

  allItems = data;

  // Build category buttons
  const categories = ['All', ...new Set(data.map(i => i.category))];
  cats.innerHTML = categories.map(c => `
    <button class="cat-btn ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>
  `).join('');

  cats.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cats.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderItems();
    });
  });

  renderItems();
}

// ── Render filtered items ──
function renderItems() {
  const grid = document.getElementById('menu-grid');
  const filtered = activeCategory === 'All'
    ? allItems
    : allItems.filter(i => i.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
      No items in this category yet.
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="card menu-card" data-id="${item.id}">
      <div class="menu-card-img">
        ${item.image_url
          ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy" />`
          : `<span>${categoryEmoji[item.category] || '🍽️'}</span>`}
        ${!item.available ? `<div class="sold-out-overlay">Sold Out</div>` : ''}
      </div>
      <div class="menu-card-body">
        <div class="menu-card-cat">${item.category}</div>
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.description || ''}</div>
        <div class="menu-card-footer">
          <span class="menu-price">$${Number(item.price).toFixed(2)}</span>
          <button
            class="add-to-cart"
            data-id="${item.id}"
            data-name="${item.name}"
            data-price="${item.price}"
            data-category="${item.category}"
            ${!item.available ? 'disabled' : ''}
            title="${item.available ? 'Add to cart' : 'Sold out'}"
          >+</button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach add-to-cart handlers
  grid.querySelectorAll('.add-to-cart:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      Cart.add({
        id:       btn.dataset.id,
        name:     btn.dataset.name,
        price:    parseFloat(btn.dataset.price),
        category: btn.dataset.category,
      });
      // Animate
      btn.textContent = '✓';
      btn.style.background = 'var(--primary)';
      setTimeout(() => {
        btn.textContent = '+';
        btn.style.background = '';
      }, 800);
    });
  });
}

document.addEventListener('DOMContentLoaded', loadMenu);
