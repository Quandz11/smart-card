const API_BASE = 'http://localhost:3000/api';

const api = {
  getToken() {
    return localStorage.getItem('smartpass_admin_token');
  },

  setToken(token) {
    localStorage.setItem('smartpass_admin_token', token);
  },

  clearToken() {
    localStorage.removeItem('smartpass_admin_token');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error(data.message || 'Session expired. Please log in again.');
      }

      if (response.status === 403) {
        window.dispatchEvent(
          new CustomEvent('auth:forbidden', {
            detail: { message: 'You do not have permission for this action' },
          })
        );
        throw new Error('You do not have permission for this action');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  // Users
  getUsers(q = '', page = 1, limit = 50) {
    return this.request(`/users?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
  },

  createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  deactivateUser(id) {
    return this.request(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Cards
  getCards(status = '', page = 1, limit = 50) {
    return this.request(`/cards?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`);
  },

  createCard(cardData) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  },

  issueCard(id) {
    return this.request(`/cards/${id}/issue`, { method: 'PATCH' });
  },

  lockCard(id) {
    return this.request(`/cards/${id}/lock`, { method: 'PATCH' });
  },

  unlockCard(id) {
    return this.request(`/cards/${id}/unlock`, { method: 'PATCH' });
  },

  renewCard(id, months) {
    return this.request(`/cards/${id}/renew`, {
      method: 'PATCH',
      body: JSON.stringify({ months }),
    });
  },

  markCardLost(id) {
    return this.request(`/cards/${id}/lost`, { method: 'PATCH' });
  },

  deleteCard(id) {
    return this.request(`/cards/${id}`, { method: 'DELETE' });
  },

  getCardHistory(id) {
    return this.request(`/cards/${id}/history`);
  },

  // Logs
  getLogs(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/logs?${params}`);
  },

  // Parking
  getActiveParking() {
    return this.request('/parking/active');
  },

  // Library
  getAllLoans() {
    return this.request('/library/loans');
  },

  // Room Bookings
  getAvailability(date, room) {
    return this.request(`/rooms/availability?date=${date}&room=${encodeURIComponent(room)}`);
  },

  approveBooking(id) {
    return this.request(`/room-bookings/${id}/approve`, {
      method: 'PATCH',
    });
  },

  rejectBooking(id) {
    return this.request(`/room-bookings/${id}/reject`, {
      method: 'PATCH',
    });
  },

  // Events
  getEvents() {
    return this.request('/events');
  },

  createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Schedules
  getSchedules(className = '') {
    return this.request(`/schedules?className=${encodeURIComponent(className)}`);
  },

  createSchedule(scheduleData) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  },

  deleteSchedule(id) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  sendNotification(notifData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notifData),
    });
  },
};

