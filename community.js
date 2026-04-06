// =============================================
// community.js — Events, RSVPs, Gallery
// =============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Load Events ──
async function loadEvents() {
  const container = document.getElementById('events-container');
  container.innerHTML = `<div class="page-loader"><div class="loading-dots"><span></span><span></span><span></span></div></div>`;

  const { data: events, error } = await db
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date');

  if (error || !events?.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:3rem">No upcoming events. Check back soon!</p>`;
    return;
  }

  // Get RSVP counts
  const { data: rsvpCounts } = await db.from('rsvps').select('event_id');
  const countMap = {};
  (rsvpCounts || []).forEach(r => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
  });

  container.innerHTML = `<div class="events-grid">${events.map(e => renderEventCard(e, countMap[e.id] || 0)).join('')}</div>`;

  // Attach RSVP button handlers
  container.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.addEventListener('click', () => openRsvpModal(btn.dataset.id, btn.dataset.title));
  });
}

function renderEventCard(event, rsvpCount) {
  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const spotsLeft = event.capacity - rsvpCount;

  return `
    <div class="card event-card">
      <div class="event-date-block">
        <span>📅</span> ${dateStr} · ${timeStr}
      </div>
      <h3 class="event-title">${event.title}</h3>
      <p class="event-desc">${event.description || ''}</p>
      <div class="event-meta">
        <div>
          ${event.location ? `<span class="tag">📍 ${event.location}</span>` : ''}
        </div>
        <span class="rsvp-count">${rsvpCount} / ${event.capacity} going</span>
      </div>
      <div style="margin-top:1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;">
        ${spotsLeft > 0
          ? `<button class="btn btn-primary btn-sm rsvp-btn" data-id="${event.id}" data-title="${event.title}">RSVP Now</button>`
          : `<span class="badge badge-muted">Event Full</span>`}
        <span style="font-size:0.78rem;color:var(--text-muted)">${spotsLeft} spots left</span>
      </div>
    </div>
  `;
}

// ── RSVP Modal ──
let currentEventId = null;

function openRsvpModal(eventId, title) {
  currentEventId = eventId;
  document.getElementById('rsvp-event-title').textContent = title;
  document.getElementById('rsvp-form').reset();
  document.getElementById('rsvp-modal').classList.add('open');
}

function closeRsvpModal() {
  document.getElementById('rsvp-modal').classList.remove('open');
  currentEventId = null;
}

async function submitRsvp(e) {
  e.preventDefault();
  const name  = document.getElementById('rsvp-name').value.trim();
  const email = document.getElementById('rsvp-email').value.trim();
  const btn   = e.target.querySelector('button[type="submit"]');

  if (!name || !email || !currentEventId) return;

  btn.disabled = true;
  btn.textContent = 'Saving…';

  const { error } = await db.from('rsvps').insert({
    event_id:   currentEventId,
    user_name:  name,
    user_email: email,
  });

  btn.disabled = false;
  btn.textContent = 'Confirm RSVP';

  if (error) {
    if (error.code === '23505') {
      Toast.show('You\'ve already RSVP\'d for this event!', 'info');
    } else {
      Toast.show('Failed to RSVP. Please try again.', 'error');
    }
    return;
  }

  closeRsvpModal();
  Toast.show('🎉 You\'re on the list! See you there.', 'success');
  loadEvents(); // Refresh counts
}

// ── Load Gallery ──
async function loadGallery() {
  const container = document.getElementById('gallery-container');
  const { data, error } = await db.from('gallery').select('*').order('created_at', { ascending: false });

  if (error || !data?.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--text-muted)">Gallery coming soon.</p>`;
    return;
  }

  container.innerHTML = `<div class="gallery-grid">${data.map(img => `
    <div class="gallery-item">
      <img src="${img.image_url}" alt="${img.caption || ''}" loading="lazy" />
      ${img.caption ? `<div class="gallery-caption">${img.caption}</div>` : ''}
    </div>
  `).join('')}</div>`;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  loadGallery();

  // RSVP modal events
  document.getElementById('rsvp-form')?.addEventListener('submit', submitRsvp);
  document.getElementById('rsvp-modal-close')?.addEventListener('click', closeRsvpModal);
  document.getElementById('rsvp-modal')?.addEventListener('click', e => {
    if (e.target.id === 'rsvp-modal') closeRsvpModal();
  });
});
