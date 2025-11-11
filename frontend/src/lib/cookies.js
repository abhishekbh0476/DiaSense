// Cookie utility functions for client-side token management

/**
 * Set a cookie with the given name, value, and options
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {object} options - Cookie options (expires, path, secure, sameSite)
 */
export function setCookie(name, value, options = {}) {
  if (typeof document === 'undefined') return; // SSR check
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (options.expires) {
    if (options.expires instanceof Date) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    } else if (typeof options.expires === 'number') {
      // Expires in days
      const date = new Date();
      date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      cookieString += `; expires=${date.toUTCString()}`;
    }
  }
  
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += `; path=/`;
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookieString += `; secure`;
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null; // SSR check
  
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 * @param {object} options - Cookie options (path, domain)
 */
export function deleteCookie(name, options = {}) {
  if (typeof document === 'undefined') return; // SSR check
  
  setCookie(name, '', {
    ...options,
    expires: new Date(0) // Set to past date to delete
  });
}

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} True if cookie exists
 */
export function hasCookie(name) {
  return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 * @returns {object} Object with cookie names as keys and values as values
 */
export function getAllCookies() {
  if (typeof document === 'undefined') return {}; // SSR check
  
  const cookies = {};
  const cookieArray = document.cookie.split(';');
  
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }
  
  return cookies;
}
