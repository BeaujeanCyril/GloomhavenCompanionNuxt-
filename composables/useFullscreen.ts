export const useFullscreen = () => {
  const isFullscreen = useState('isFullscreen', () => false)

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  return {
    isFullscreen,
    toggleFullscreen,
    handleFullscreenChange
  }
}
