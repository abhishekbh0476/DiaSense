// API utility functions for making authenticated requests
import { getCookie, setCookie, deleteCookie } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Store in both localStorage and cookies for compatibility
      localStorage.setItem('token', token);
      setCookie('clientToken', token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first, then cookies
      this.token = localStorage.getItem('token') || getCookie('clientToken');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      deleteCookie('clientToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const token = this.getToken();
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request Debug:', {
        endpoint,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
      });
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include', // Include cookies in requests
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = { error: 'Invalid response format' };
      }

      if (!response.ok) {
        // Don't throw for 404s on optional endpoints, just return empty data
        if (response.status === 404 && (endpoint.includes('/community/') || endpoint.includes('/reports'))) {
          return { [endpoint.includes('groups') ? 'groups' : endpoint.includes('recipes') ? 'recipes' : 'data']: [] };
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // For network errors or server errors, return empty data structure
      if (error.name === 'TypeError' || error.message.includes('500')) {
        if (endpoint.includes('/glucose')) {
          return { readings: [], stats: {} };
        } else if (endpoint.includes('/medications')) {
          return { medications: [] };
        } else if (endpoint.includes('/groups')) {
          return { groups: [] };
        } else if (endpoint.includes('/recipes')) {
          return { recipes: [] };
        } else if (endpoint.includes('/alerts')) {
          return { alerts: [] };
        }
      }
      
      throw error;
    }
  }

  // Glucose readings
  async getGlucoseReadings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/glucose${queryString ? `?${queryString}` : ''}`);
  }

  async addGlucoseReading(reading) {
    return this.request('/glucose', {
      method: 'POST',
      body: reading,
    });
  }

  // Medications
  async getMedications(activeOnly = false) {
    return this.request(`/medications${activeOnly ? '?active=true' : ''}`);
  }

  async addMedication(medication) {
    return this.request('/medications', {
      method: 'POST',
      body: medication,
    });
  }

  async updateMedicationLog(logId, status, notes = '') {
    return this.request(`/medications/${logId}/log`, {
      method: 'PATCH',
      body: { status, notes },
    });
  }

  // Caregivers
  async getCaregivers() {
    return this.request('/caregivers');
  }

  async addCaregiver(caregiver) {
    return this.request('/caregivers', {
      method: 'POST',
      body: caregiver,
    });
  }

  async updateCaregiver(caregiverId, updates) {
    return this.request(`/caregivers/${caregiverId}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  async addDoctor(doctor) {
    return this.request('/doctors', {
      method: 'POST',
      body: doctor,
    });
  }

  // Alerts
  async getAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/alerts${queryString ? `?${queryString}` : ''}`);
  }

  async createAlert(alert) {
    return this.request('/alerts', {
      method: 'POST',
      body: alert,
    });
  }

  async acknowledgeAlert(alertId) {
    return this.request(`/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
    });
  }

  // Community
  async getCommunityGroups(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/groups${queryString ? `?${queryString}` : ''}`);
  }

  async createCommunityGroup(group) {
    return this.request('/community/groups', {
      method: 'POST',
      body: group,
    });
  }

  async joinGroup(groupId) {
    return this.request(`/community/groups/${groupId}`, {
      method: 'POST',
    });
  }

  async getRecipes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/recipes${queryString ? `?${queryString}` : ''}`);
  }

  async createRecipe(recipe) {
    return this.request('/community/recipes', {
      method: 'POST',
      body: recipe,
    });
  }

  async likeRecipe(recipeId) {
    return this.request(`/community/recipes/${recipeId}/like`, {
      method: 'POST',
    });
  }

  async saveRecipe(recipeId) {
    return this.request(`/community/recipes/${recipeId}/save`, {
      method: 'POST',
    });
  }

  // Stories
  async getStories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/stories${queryString ? `?${queryString}` : ''}`);
  }

  async createStory(story) {
    return this.request('/community/stories', {
      method: 'POST',
      body: story,
    });
  }

  // Events
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/events${queryString ? `?${queryString}` : ''}`);
  }

  async createEvent(event) {
    return this.request('/community/events', {
      method: 'POST',
      body: event,
    });
  }

  // Dashboard stats
  async getDashboardStats(days = 7) {
    return this.request(`/dashboard/stats?days=${days}`);
  }

  // Reports
  async getReports() {
    return this.request('/reports');
  }

  async generateReport(reportConfig) {
    return this.request('/reports', {
      method: 'POST',
      body: reportConfig,
    });
  }

  async shareReport(reportId, contacts) {
    return this.request(`/reports/${reportId}/share`, {
      method: 'POST',
      body: { contacts },
    });
  }

  // Dashboard stats
  async getDashboardStats(days = 7) {
    return this.request(`/dashboard/stats?days=${days}`);
  }

  // User profile
  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PATCH',
      body: profileData,
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export individual methods for convenience
export const {
  setToken,
  getToken,
  clearToken,
  getGlucoseReadings,
  addGlucoseReading,
  getMedications,
  addMedication,
  updateMedicationLog,
  getCaregivers,
  addCaregiver,
  updateCaregiver,
  getDoctors,
  addDoctor,
  getAlerts,
  createAlert,
  acknowledgeAlert,
  getCommunityGroups,
  createCommunityGroup,
  joinGroup,
  getRecipes,
  createRecipe,
  likeRecipe,
  saveRecipe,
  getStories,
  createStory,
  getEvents,
  createEvent,
  getReports,
  generateReport,
  shareReport,
  getDashboardStats,
  updateProfile,
} = apiClient;
