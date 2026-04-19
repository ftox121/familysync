import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  Constants.manifest?.debuggerHost ||
  ''

const detectedHost = hostUri ? hostUri.split(':')[0] : ''

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (detectedHost ? `http://${detectedHost}:3000/api` : 'http://localhost:3000/api')

class ApiClient {
  constructor() {
    this.token = null
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token')
    }
    return this.token
  }

  async getOrCreateLocalIdentity() {
    let email = await AsyncStorage.getItem('local_identity_email')
    let password = await AsyncStorage.getItem('local_identity_password')
    let fullName = await AsyncStorage.getItem('local_identity_name')

    if (!email || !password || !fullName) {
      const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      email = `parent.${suffix}@familysync.local`
      password = `Fs!${Math.random().toString(36).slice(2, 12)}Aa1`
      fullName = 'Родитель'
      await AsyncStorage.multiSet([
        ['local_identity_email', email],
        ['local_identity_password', password],
        ['local_identity_name', fullName],
      ])
    }

    return { email, password, fullName }
  }

  async setToken(token) {
    this.token = token
    await AsyncStorage.setItem('auth_token', token)
  }

  async clearToken() {
    this.token = null
    await AsyncStorage.removeItem('auth_token')
  }

  async clearLocalIdentity() {
    await AsyncStorage.multiRemove([
      'local_identity_email',
      'local_identity_password',
      'local_identity_name',
      'auth_token',
    ])
    this.token = null
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    let response
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if (error?.name === 'AbortError') {
        throw new Error('Server timeout: проверьте backend и сеть')
      }
      throw new Error('Network request failed: проверьте backend и сеть')
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  async ensureSession() {
    try {
      const token = await this.getToken()
      if (token) {
        await this.me()
        return
      }
    } catch {
      await this.clearToken()
    }

    const identity = await this.getOrCreateLocalIdentity()

    try {
      await this.login(identity.email, identity.password)
    } catch {
      await this.register(identity.email, identity.password, identity.fullName)
    }
  }

  // Auth
  async register(email, password, full_name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    })
    await this.setToken(data.token)
    return data.user
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await this.setToken(data.token)
    return data.user
  }

  async me() {
    return this.request('/auth/me')
  }

  async logout() {
    await this.clearLocalIdentity()
  }

  // Families
  async getFamilies() {
    return this.request('/families')
  }

  async createFamily(data) {
    return this.request('/families', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getFamilyMembers(familyId) {
    return this.request(`/families/${familyId}/members`)
  }

  async addFamilyMember(familyId, data) {
    return this.request(`/families/${familyId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFamilyMember(memberId, data) {
    return this.request(`/families/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async removeFamilyMember(familyId, memberId) {
    return this.request(`/families/${familyId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  async joinFamilyByCode(data) {
    return this.request('/families/join', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createChildProfile(familyId, data) {
    return this.request(`/families/${familyId}/children`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getFamilyMessages(familyId) {
    return this.request(`/families/${familyId}/messages`)
  }

  async sendFamilyMessage(familyId, message) {
    return this.request(`/families/${familyId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  // Tasks
  async getTasks(familyId) {
    return this.request(`/tasks?family_id=${familyId}`)
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`)
  }

  async createTask(data) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async completeQuestParticipation(taskId) {
    return this.request(`/tasks/${taskId}/participants/complete`, {
      method: 'POST',
    })
  }

  async updateTask(id, data) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications')
  }

  async createNotification(data) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markNotificationRead(id, is_read = true) {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_read }),
    })
  }

  // Rewards
  async getRewards(familyId) {
    return this.request(`/rewards?family_id=${familyId}`)
  }

  async createReward(data) {
    return this.request('/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async claimReward(rewardId) {
    return this.request(`/rewards/${rewardId}/claim`, {
      method: 'POST',
    })
  }

  async redeemReward(rewardId) {
    return this.request(`/rewards/${rewardId}/redeem`, {
      method: 'POST',
    })
  }

  async getRewardClaims(familyId) {
    return this.request(`/rewards/claims?family_id=${familyId}`)
  }

  async updateRewardClaim(claimId, status) {
    return this.request(`/rewards/claims/${claimId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Messages
  async getTaskMessages(taskId) {
    return this.request(`/tasks/${taskId}/messages`)
  }

  async sendTaskMessage(taskId, message) {
    return this.request(`/tasks/${taskId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }
}

export const apiClient = new ApiClient()
