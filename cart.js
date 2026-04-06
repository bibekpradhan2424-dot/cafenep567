// =============================================
// cart.js — Cart management with localStorage
// =============================================

const CART_KEY = 'cafe_cart';

const Cart = {
  // Get cart from storage
  get() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch { return []; }
  },

  // Save cart to storage
  save(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    this.updateBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  },

  // Add item
  add(item) {
    const cart = this.get();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    this.save(cart);
    Toast.show(`${item.name} added to cart`, 'success');
  },

  // Remove item
  remove(id) {
    const cart = this.get().filter(i => i.id !== id);
    this.save(cart);
  },

  // Update quantity
  updateQty(id, delta) {
    const cart = this.get();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.save(cart.filter(i => i.id !== id));
    } else {
      this.save(cart);
    }
  },

  // Clear cart
  clear() {
    localStorage.removeItem(CART_KEY);
    this.updateBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
  },

  // Get totals
  totals() {
    const cart = this.get();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total, count: cart.reduce((s, i) => s + i.quantity, 0) };
  },

  // Update cart badge in navbar
  updateBadge() {
    const count = this.get().reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.cart-badge-count').forEach(el => {
      el.textContent = count;
    });
  }
};

// =============================================
// Toast notification system
// =============================================
const Toast = {
  container: null,

  init() {
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// =============================================
// Navbar helpers
// =============================================
function initNavbar() {
  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));

  // Active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path.split('/').pop() ||
        (path.endsWith('/') && link.getAttribute('href') === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Init cart badge
  Cart.updateBadge();
  Toast.init();
}

document.addEventListener('DOMContentLoaded', initNavbar);
