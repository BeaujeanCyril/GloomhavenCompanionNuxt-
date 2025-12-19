// composables/useToast.ts
export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (process.client) {
      // Créer l'élément toast
      const toast = document.createElement('div')
      toast.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 1rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: all 0.3s;
        transform: translateX(0);
        opacity: 1;
        ${type === 'success'
          ? 'background: linear-gradient(to right, #16a34a, #15803d); color: white;'
          : type === 'error'
          ? 'background: linear-gradient(to right, #dc2626, #b91c1c); color: white;'
          : 'background: linear-gradient(to right, #2563eb, #1d4ed8); color: white;'
        }
      `

      // Icône selon le type
      const icon = type === 'success'
        ? '✓'
        : type === 'error'
        ? '✕'
        : 'ℹ'

      toast.innerHTML = `
        <span style="font-size: 1.5rem; font-weight: bold;">${icon}</span>
        <span style="font-weight: 600;">${message}</span>
      `

      document.body.appendChild(toast)

      // Animation d'entrée
      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)'
      })

      // Retirer après 3 secondes
      setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 300)
      }, 3000)
    }
  }

  return { showToast }
}
