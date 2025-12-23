import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'https://auth.cyriongames.fr',
  realm: 'cyriongames',
  clientId: 'gloomhaven'
}

let keycloakInstance: Keycloak | null = null

// TEMPORAIRE: Bypass auth pour Gloomhaven
const BYPASS_AUTH = true

export const useAuth = () => {
  const isAuthenticated = useState<boolean>('isAuthenticated', () => BYPASS_AUTH)
  const user = useState<{ name: string; email: string } | null>('user', () => BYPASS_AUTH ? { name: 'Invité', email: '' } : null)
  const isLoading = useState<boolean>('authLoading', () => false)
  const hasAccess = useState<boolean>('hasAccess', () => BYPASS_AUTH)

  const initKeycloak = async () => {
    // TEMPORAIRE: Bypass auth
    if (BYPASS_AUTH) {
      isLoading.value = false
      isAuthenticated.value = true
      hasAccess.value = true
      user.value = { name: 'Invité', email: '' }
      return
    }

    if (typeof window === 'undefined') {
      isLoading.value = false
      return
    }

    if (!keycloakInstance) {
      keycloakInstance = new Keycloak(keycloakConfig)
    }

    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false
      })

      isAuthenticated.value = authenticated

      if (authenticated && keycloakInstance.tokenParsed) {
        user.value = {
          name: keycloakInstance.tokenParsed.preferred_username || keycloakInstance.tokenParsed.name || 'Utilisateur',
          email: keycloakInstance.tokenParsed.email || ''
        }

        // Vérifier l'accès à cette app
        const isSuperAdmin = keycloakInstance.hasRealmRole('superadmin')
        const hasAppRole = keycloakInstance.hasRealmRole('gloomhaven.access')
        hasAccess.value = isSuperAdmin || hasAppRole
      }
    } catch (error) {
      console.error('Keycloak init error:', error)
      isAuthenticated.value = false
      hasAccess.value = false
    } finally {
      isLoading.value = false
    }
  }

  const login = () => {
    if (keycloakInstance) {
      keycloakInstance.login()
    }
  }

  const logout = () => {
    if (keycloakInstance) {
      keycloakInstance.logout({ redirectUri: 'https://cyriongames.fr' })
    }
  }

  const redirectToPortal = () => {
    window.location.href = 'https://cyriongames.fr'
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    isLoading: readonly(isLoading),
    hasAccess: readonly(hasAccess),
    initKeycloak,
    login,
    logout,
    redirectToPortal
  }
}
