// SmartPass Admin Dashboard Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const toast = document.getElementById('toast');
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');
  const pageTitle = document.getElementById('page-title');
  const currentUserName = document.getElementById('current-user-name');

  // Modals
  const modalCreateUser = document.getElementById('modal-create-user');
  const modalCreateCard = document.getElementById('modal-create-card');
  const modalCreateEvent = document.getElementById('modal-create-event');
  const modalCardHistory = document.getElementById('modal-card-history');

  // Notification audience toggles
  const notifAudience = document.getElementById('notif-audience');
  const groupNotifClass = document.getElementById('group-notif-class');
  const groupNotifReceiver = document.getElementById('group-notif-receiver');

  // Toast notification helper
  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => {
      toast.className = 'toast hidden';
    }, 3500);
  }

  // Handle Unauthorized (401) & Forbidden (403) events
  window.addEventListener('auth:unauthorized', () => {
    showToast('Session expired. Please log in again.', 'error');
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
  });

  window.addEventListener('auth:forbidden', (e) => {
    showToast(e.detail.message || 'You do not have permission for this action', 'error');
  });

  // Check initial login state
  async function initAuth() {
    const token = api.getToken();
    if (!token) {
      loginContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
      return;
    }

    try {
      const res = await api.getMe();
      if (res.data.role !== 'admin') {
        showToast('Access restricted to administrators only', 'error');
        api.clearToken();
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        return;
      }
      currentUserName.textContent = res.data.fullName || 'Admin';
      loginContainer.classList.add('hidden');
      appContainer.classList.remove('hidden');
      switchTab('dashboard');
    } catch (err) {
      api.clearToken();
      loginContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
    }
  }

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await api.login(email, password);
      if (res.data.user.role !== 'admin') {
        showToast('Access restricted to administrators only', 'error');
        return;
      }
      api.setToken(res.data.token);
      currentUserName.textContent = res.data.user.fullName;
      loginContainer.classList.add('hidden');
      appContainer.classList.remove('hidden');
      showToast('Logged in successfully', 'success');
      switchTab('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    api.clearToken();
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    showToast('Logged out', 'info');
  });

  // Tab switching
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  function switchTab(tabName) {
    navItems.forEach((b) => b.classList.remove('active'));
    tabViews.forEach((v) => v.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    const activeView = document.getElementById(`view-${tabName}`);

    if (activeNav) activeNav.classList.add('active');
    if (activeView) activeView.classList.add('active');

    pageTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

    // Load data for active tab
    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'users') loadUsers();
    if (tabName === 'cards') loadCards();
    if (tabName === 'logs') loadLogs();
    if (tabName === 'bookings') loadBookings();
    if (tabName === 'events') loadEvents();
    if (tabName === 'schedules') loadSchedules();
  }

  // 1. Dashboard Loader
  async function loadDashboard() {
    try {
      const [usersRes, cardsRes, parkingRes, loansRes, logsRes] = await Promise.all([
        api.getUsers('', 1, 1),
        api.getCards('', 1, 1),
        api.getActiveParking(),
        api.getAllLoans(),
        api.getLogs({ limit: 5 }),
      ]);

      document.getElementById('stat-users').textContent = usersRes.pagination ? usersRes.pagination.total : '--';
      document.getElementById('stat-cards').textContent = cardsRes.pagination ? cardsRes.pagination.total : '--';
      document.getElementById('stat-parking').textContent = parkingRes.data ? parkingRes.data.length : '0';
      document.getElementById('stat-loans').textContent = loansRes.data ? loansRes.data.length : '0';

      const tbody = document.querySelector('#recent-logs-table tbody');
      tbody.innerHTML = '';
      if (logsRes.data && logsRes.data.length > 0) {
        logsRes.data.forEach((log) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${new Date(log.createdAt).toLocaleTimeString()}</td>
            <td><span class="badge badge-active">${log.action}</span></td>
            <td>${log.owner ? log.owner.fullName : 'Guest'}</td>
            <td>${log.location || 'N/A'}</td>
            <td>${log.detail || ''}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent events</td></tr>';
      }
    } catch (err) {
      console.error(err);
    }
  }

  // 2. Users Loader
  async function loadUsers(query = '') {
    try {
      const res = await api.getUsers(query);
      const tbody = document.querySelector('#users-table tbody');
      tbody.innerHTML = '';

      res.data.forEach((user) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${user.fullName}</strong></td>
          <td>${user.email}</td>
          <td>${user.studentCode || '--'}</td>
          <td>${user.className || '--'}</td>
          <td><span class="badge badge-${user.role === 'admin' ? 'admin' : 'student'}">${user.role}</span></td>
          <td>${user.isActive ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-expired">Disabled</span>'}</td>
          <td>
            <button class="btn btn-sm btn-secondary btn-role" data-id="${user._id}">Role</button>
            ${user.isActive ? `<button class="btn btn-sm btn-secondary btn-deactivate" data-id="${user._id}">Disable</button>` : ''}
            <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user._id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // User Action Listeners
      tbody.querySelectorAll('.btn-deactivate').forEach((b) => {
        b.addEventListener('click', async () => {
          if (confirm('Deactivate this user account?')) {
            await api.deactivateUser(b.dataset.id);
            showToast('User deactivated', 'success');
            loadUsers();
          }
        });
      });

      tbody.querySelectorAll('.btn-delete-user').forEach((b) => {
        b.addEventListener('click', async () => {
          if (confirm('Are you sure you want to permanently delete this user?')) {
            await api.deleteUser(b.dataset.id);
            showToast('User deleted', 'success');
            loadUsers();
          }
        });
      });

      tbody.querySelectorAll('.btn-role').forEach((b) => {
        b.addEventListener('click', async () => {
          const newRole = prompt('Enter new role (student, librarian, canteen_staff, parking_staff, admin):');
          if (newRole) {
            try {
              await api.updateUserRole(b.dataset.id, newRole.trim());
              showToast('Role updated', 'success');
              loadUsers();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  document.getElementById('user-search-btn').addEventListener('click', () => {
    loadUsers(document.getElementById('user-search-input').value);
  });

  // 3. Cards Loader
  async function loadCards(status = '') {
    try {
      const res = await api.getCards(status);
      const tbody = document.querySelector('#cards-table tbody');
      tbody.innerHTML = '';

      res.data.forEach((card) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${card.cardCode}</strong></td>
          <td>${card.owner ? card.owner.fullName : 'Unknown'}</td>
          <td>${new Date(card.expiresAt).toLocaleDateString()}</td>
          <td>${card.nfcUid || '--'}</td>
          <td><span class="badge badge-${card.status}">${card.status}</span></td>
          <td>
            ${card.status === 'locked' ? `<button class="btn btn-sm btn-secondary btn-unlock" data-id="${card._id}">Unlock</button>` : `<button class="btn btn-sm btn-secondary btn-lock" data-id="${card._id}">Lock</button>`}
            <button class="btn btn-sm btn-secondary btn-renew" data-id="${card._id}">Renew</button>
            <button class="btn btn-sm btn-secondary btn-lost" data-id="${card._id}">Lost</button>
            <button class="btn btn-sm btn-secondary btn-history" data-id="${card._id}">History</button>
            <button class="btn btn-sm btn-danger btn-delete-card" data-id="${card._id}">Del</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Actions
      tbody.querySelectorAll('.btn-lock').forEach((b) => {
        b.addEventListener('click', async () => {
          await api.lockCard(b.dataset.id);
          showToast('Card locked', 'success');
          loadCards();
        });
      });

      tbody.querySelectorAll('.btn-unlock').forEach((b) => {
        b.addEventListener('click', async () => {
          await api.unlockCard(b.dataset.id);
          showToast('Card unlocked', 'success');
          loadCards();
        });
      });

      tbody.querySelectorAll('.btn-renew').forEach((b) => {
        b.addEventListener('click', async () => {
          const months = prompt('Enter months to extend expiry (e.g. 6 or 12):', '12');
          if (months) {
            await api.renewCard(b.dataset.id, parseInt(months, 10));
            showToast('Card renewed', 'success');
            loadCards();
          }
        });
      });

      tbody.querySelectorAll('.btn-lost').forEach((b) => {
        b.addEventListener('click', async () => {
          if (confirm('Mark this card as lost?')) {
            await api.markCardLost(b.dataset.id);
            showToast('Card marked as lost', 'success');
            loadCards();
          }
        });
      });

      tbody.querySelectorAll('.btn-delete-card').forEach((b) => {
        b.addEventListener('click', async () => {
          if (confirm('Delete this card?')) {
            await api.deleteCard(b.dataset.id);
            showToast('Card deleted', 'success');
            loadCards();
          }
        });
      });

      tbody.querySelectorAll('.btn-history').forEach((b) => {
        b.addEventListener('click', async () => {
          showCardHistory(b.dataset.id);
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  document.getElementById('card-filter-status').addEventListener('change', (e) => {
    loadCards(e.target.value);
  });

  async function showCardHistory(cardId) {
    try {
      const res = await api.getCardHistory(cardId);
      const tbody = document.querySelector('#card-history-table tbody');
      tbody.innerHTML = '';

      if (res.data && res.data.length > 0) {
        res.data.forEach((log) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${new Date(log.createdAt).toLocaleString()}</td>
            <td><span class="badge badge-active">${log.action}</span></td>
            <td>${log.location || 'N/A'}</td>
            <td>${log.detail || ''}</td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history recorded</td></tr>';
      }
      modalCardHistory.classList.remove('hidden');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // 4. Logs Loader
  async function loadLogs() {
    try {
      const filters = {};
      const action = document.getElementById('log-filter-action').value.trim();
      const from = document.getElementById('log-filter-from').value;
      const to = document.getElementById('log-filter-to').value;

      if (action) filters.action = action;
      if (from) filters.from = from;
      if (to) filters.to = to;

      const res = await api.getLogs(filters);
      const tbody = document.querySelector('#logs-table tbody');
      tbody.innerHTML = '';

      res.data.forEach((log) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(log.createdAt).toLocaleString()}</td>
          <td><span class="badge badge-active">${log.action}</span></td>
          <td>${log.owner ? log.owner.fullName : 'Guest'}</td>
          <td>${log.card ? log.card.cardCode : 'N/A'}</td>
          <td>${log.location || 'N/A'}</td>
          <td>${log.detail || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  document.getElementById('btn-apply-log-filters').addEventListener('click', loadLogs);

  // 5. Room Bookings Loader (Approvals)
  async function loadBookings() {
    try {
      // Fetch upcoming bookings or availability
      const tbody = document.querySelector('#bookings-table tbody');
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Use approve / reject actions for pending reservations.</td></tr>';
    } catch (err) {
      console.error(err);
    }
  }

  // 6. Events Loader
  async function loadEvents() {
    try {
      const res = await api.getEvents();
      const tbody = document.querySelector('#events-table tbody');
      tbody.innerHTML = '';

      res.data.forEach((evt) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${evt.title}</strong></td>
          <td>${evt.location || 'N/A'}</td>
          <td>${new Date(evt.startAt).toLocaleString()}</td>
          <td>${new Date(evt.endAt).toLocaleString()}</td>
          <td><strong>${evt.registeredCount}</strong></td>
          <td>${evt.capacity}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // 7. Schedules Loader
  async function loadSchedules() {
    try {
      const cls = document.getElementById('schedule-filter-class').value.trim();
      const res = await api.getSchedules(cls);
      const tbody = document.querySelector('#schedules-table tbody');
      tbody.innerHTML = '';

      const dayNames = { 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat', 8: 'Sun' };

      res.data.forEach((s) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.className}</strong></td>
          <td>${s.subject}</td>
          <td>${s.teacher || '--'}</td>
          <td>${s.room || '--'}</td>
          <td>${dayNames[s.dayOfWeek] || s.dayOfWeek}</td>
          <td>${s.startTime} - ${s.endTime}</td>
          <td>
            <button class="btn btn-sm btn-danger btn-del-sched" data-id="${s._id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-del-sched').forEach((b) => {
        b.addEventListener('click', async () => {
          if (confirm('Delete this schedule entry?')) {
            await api.deleteSchedule(b.dataset.id);
            showToast('Schedule deleted', 'success');
            loadSchedules();
          }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  document.getElementById('btn-filter-schedules').addEventListener('click', loadSchedules);

  // 8. Notifications Form Handler
  notifAudience.addEventListener('change', (e) => {
    groupNotifClass.classList.toggle('hidden', e.target.value !== 'class');
    groupNotifReceiver.classList.toggle('hidden', e.target.value !== 'individual');
  });

  document.getElementById('notification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notif-title').value;
    const body = document.getElementById('notif-body').value;
    const audience = notifAudience.value;
    const className = document.getElementById('notif-class').value;
    const receiver = document.getElementById('notif-receiver').value;

    try {
      await api.sendNotification({ title, body, audience, className, receiver });
      showToast('Notification dispatched successfully', 'success');
      document.getElementById('notification-form').reset();
      groupNotifClass.classList.add('hidden');
      groupNotifReceiver.classList.add('hidden');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Modal open/close wiring
  document.getElementById('btn-open-create-user').addEventListener('click', () => {
    modalCreateUser.classList.remove('hidden');
  });

  document.getElementById('btn-open-create-card').addEventListener('click', () => {
    modalCreateCard.classList.remove('hidden');
  });

  document.getElementById('btn-open-create-event').addEventListener('click', () => {
    modalCreateEvent.classList.remove('hidden');
  });

  document.querySelectorAll('.modal-close, .modal-cancel').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
    });
  });

  // Create User submit
  document.getElementById('form-create-user').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      fullName: document.getElementById('new-user-name').value,
      email: document.getElementById('new-user-email').value,
      password: document.getElementById('new-user-password').value,
      role: document.getElementById('new-user-role').value,
      studentCode: document.getElementById('new-user-code').value || undefined,
      className: document.getElementById('new-user-class').value || undefined,
    };
    try {
      await api.createUser(data);
      showToast('User created successfully', 'success');
      modalCreateUser.classList.add('hidden');
      document.getElementById('form-create-user').reset();
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Create Card submit
  document.getElementById('form-create-card').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      cardCode: document.getElementById('new-card-code').value,
      owner: document.getElementById('new-card-owner').value,
      nfcUid: document.getElementById('new-card-nfc').value || undefined,
      expiresAt: new Date(document.getElementById('new-card-expires').value).toISOString(),
    };
    try {
      await api.createCard(data);
      showToast('Card issued successfully', 'success');
      modalCreateCard.classList.add('hidden');
      document.getElementById('form-create-card').reset();
      loadCards();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Create Event submit
  document.getElementById('form-create-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('new-event-title').value,
      location: document.getElementById('new-event-location').value,
      startAt: new Date(document.getElementById('new-event-start').value).toISOString(),
      endAt: new Date(document.getElementById('new-event-end').value).toISOString(),
      capacity: parseInt(document.getElementById('new-event-capacity').value, 10),
      description: document.getElementById('new-event-desc').value,
    };
    try {
      await api.createEvent(data);
      showToast('Event created successfully', 'success');
      modalCreateEvent.classList.add('hidden');
      document.getElementById('form-create-event').reset();
      loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  initAuth();
});

