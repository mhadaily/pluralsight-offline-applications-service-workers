/**
 * UI Utility Functions
 * Toast notifications, loading states, and common UI helpers
 */

let toastId = 0;

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${++toastId}`;
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);

  // Allow manual close on click
  toast.addEventListener('click', () => {
    removeToast(id);
  });

  return id;
}

/**
 * Remove toast by ID
 * @param {string} id - Toast ID
 */
export function removeToast(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.style.animation = 'toast-enter 0.3s ease reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

/**
 * Show loading spinner
 */
export function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }
}

/**
 * Hide loading spinner
 */
export function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

/**
 * Update active navigation link
 * @param {string} route - Current route
 */
export function updateNavigation(route) {
  const links = document.querySelectorAll('.nav-link');
  links.forEach((link) => {
    link.classList.remove('active');
    if (
      link.dataset.route === route ||
      (route === 'home' && link.dataset.route === 'home') ||
      (route === '' && link.dataset.route === 'home')
    ) {
      link.classList.add('active');
    }
  });
}

/**
 * Render content to main container
 * @param {string} html - HTML content to render
 */
export function renderContent(html) {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = html;
  }
}

/**
 * Create a card element
 * @param {Object} options - Card options
 * @param {string} options.title - Card title
 * @param {string} options.content - Card content
 * @param {string} options.footer - Card footer HTML
 * @param {string} options.className - Additional CSS classes
 */
export function createCard({ title, content, footer, className = '' }) {
  return `
    <div class="card ${className}">
      ${
        title
          ? `
        <div class="card-header">
          <h3 class="card-title">${title}</h3>
        </div>
      `
          : ''
      }
      ${
        content
          ? `
        <div class="card-content">
          ${content}
        </div>
      `
          : ''
      }
      ${
        footer
          ? `
        <div class="card-footer">
          ${footer}
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Create a form input group
 * @param {Object} options - Input options
 * @param {string} options.label - Input label
 * @param {string} options.type - Input type
 * @param {string} options.id - Input ID
 * @param {string} options.placeholder - Input placeholder
 * @param {string} options.value - Input value
 * @param {boolean} options.required - Whether input is required
 */
export function createInput({
  label,
  type = 'text',
  id,
  placeholder,
  value = '',
  required = false,
}) {
  return `
    <div class="form-group">
      <label for="${id}" class="form-label">${label}</label>
      <input 
        type="${type}" 
        id="${id}" 
        class="form-input" 
        placeholder="${placeholder || ''}"
        value="${value}"
        ${required ? 'required' : ''}
      >
    </div>
  `;
}

/**
 * Create a textarea input group
 * @param {Object} options - Textarea options
 */
export function createTextarea({
  label,
  id,
  placeholder,
  value = '',
  required = false,
  rows = 4,
}) {
  return `
    <div class="form-group">
      <label for="${id}" class="form-label">${label}</label>
      <textarea 
        id="${id}" 
        class="form-textarea" 
        placeholder="${placeholder || ''}"
        rows="${rows}"
        ${required ? 'required' : ''}
      >${value}</textarea>
    </div>
  `;
}

/**
 * Create a button element
 * @param {Object} options - Button options
 */
export function createButton({
  text,
  type = 'button',
  className = 'btn-primary',
  onclick,
  disabled = false,
  id,
}) {
  const onclickAttr = onclick ? `onclick="${onclick}"` : '';
  const idAttr = id ? `id="${id}"` : '';
  const disabledAttr = disabled ? 'disabled' : '';

  return `
    <button 
      type="${type}" 
      class="btn ${className}" 
      ${onclickAttr}
      ${idAttr}
      ${disabledAttr}
    >
      ${text}
    </button>
  `;
}

/**
 * Format date for display
 * @param {number|Date} date - Date to format
 */
export function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return d.toLocaleDateString();
  }
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 */
export function showConfirmDialog(message, title = 'Confirm') {
  return confirm(`${title}\n\n${message}`);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Failed to copy to clipboard', 'error');
  }
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 * @param {string|Element} target - Element or selector to scroll to
 */
export function scrollTo(target) {
  const element =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
