export const useTheme = () => {
  const isDarkMode = useState('isDarkMode', () => true) // Dark par défaut

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    // Sauvegarder la préférence dans localStorage
    if (process.client) {
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    }
  }

  const initTheme = () => {
    if (process.client) {
      const savedTheme = localStorage.getItem('theme')
      isDarkMode.value = savedTheme === 'light' ? false : true
    }
  }

  return {
    isDarkMode,
    toggleTheme,
    initTheme
  }
}
