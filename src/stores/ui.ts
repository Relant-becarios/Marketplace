import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isCartOpen = ref(false)
  const isMenuOpen = ref(false)
  const isAuthModalOpen = ref(false)
  const isChatOpen = ref(false)

  // LÓGICA DE TEMAS PERSISTENTE
  // Lee de localStorage o usa 'light' por defecto
  const temaActual = ref(localStorage.getItem('tema') || 'light')

  const aplicarTemaDOM = (tema: string) => {
    document.documentElement.setAttribute('data-theme', tema)
    if (tema === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Aplica el tema guardado al cargar
  aplicarTemaDOM(temaActual.value)

  function toggleTema() {
    temaActual.value = temaActual.value === 'dark' ? 'light' : 'dark'
    aplicarTemaDOM(temaActual.value)
    localStorage.setItem('tema', temaActual.value)
  }

  // Computed reactivo para vistas que requieren conocer si el tema activo es oscuro
  const isDarkTheme = computed(() => temaActual.value === 'dark')

  function toggleCart() {
    isCartOpen.value = !isCartOpen.value
    if (isCartOpen.value) {
      isMenuOpen.value = false
      isAuthModalOpen.value = false
      isChatOpen.value = false
    }
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
    if (isMenuOpen.value) {
      isCartOpen.value = false
      isAuthModalOpen.value = false
      isChatOpen.value = false
    }
  }

  function toggleAuthModal() {
    isAuthModalOpen.value = !isAuthModalOpen.value
    if (isAuthModalOpen.value) {
      isCartOpen.value = false
      isMenuOpen.value = false
      isChatOpen.value = false
    }
  }

  function toggleChat() {
    isChatOpen.value = !isChatOpen.value
    if (isChatOpen.value) {
      isCartOpen.value = false
      isMenuOpen.value = false
      isAuthModalOpen.value = false
    }
  }

  function closeAll() {
    isCartOpen.value = false
    isMenuOpen.value = false
    isAuthModalOpen.value = false
    isChatOpen.value = false
  }

  return {
    isCartOpen,
    isMenuOpen,
    isAuthModalOpen,
    isChatOpen,
    temaActual,
    isDarkTheme,
    toggleCart,
    toggleMenu,
    toggleAuthModal,
    toggleChat,
    toggleTema,
    closeAll,
  }
})
