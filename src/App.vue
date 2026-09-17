<template>
  <div id="app-layout">
    <div
      v-if="
        uiStore.isCartOpen || uiStore.isMenuOpen || uiStore.isAuthModalOpen || uiStore.isChatOpen
      "
      class="overlay"
      @click="uiStore.closeAll"
    ></div>

    <MenuPanel />
    <CartPanel />
    <AuthModal />
    <ChatPanel />

    <ThemeToggleFloating />

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useMarketStore } from '@/stores/market'
import CartPanel from '@/components/CartPanel.vue'
import MenuPanel from '@/components/MenuPanel.vue'
import AuthModal from '@/components/AuthModal.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import ThemeToggleFloating from '@/components/ThemeToggleFloating.vue'

const uiStore = useUiStore()
const marketStore = useMarketStore()

// Funciones para bloquear la apertura de DevTools
const prevenirContextMenu = (e: MouseEvent) => e.preventDefault()

const prevenirDevToolsKey = (e: KeyboardEvent) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key.toUpperCase() === 'U')
  ) {
    e.preventDefault()
  }
}

onMounted(() => {
  const tema = localStorage.getItem('theme') || 'light'
  document.documentElement.setAttribute('data-theme', tema)

  // Inicia la sincronización automática en segundo plano (cada 60 segundos)
  marketStore.iniciarSincronizacionAuto(60)

  // Bloqueo de clic derecho y atajos de teclado
  document.addEventListener('contextmenu', prevenirContextMenu)
  document.addEventListener('keydown', prevenirDevToolsKey)
})

onUnmounted(() => {
  marketStore.detenerSincronizacionAuto()

  // Limpieza de eventos
  document.removeEventListener('contextmenu', prevenirContextMenu)
  document.removeEventListener('keydown', prevenirDevToolsKey)
})
</script>

<style>
/* --- VARIABLES GLOBALES DE CSS --- */

/* MODO CLARO (Por defecto) */
:root {
  --bg-main: #f4f6f8;
  --bg-panel: #ffffff;
  --bg-input: #e9ecef;
  --text-main: #1c1e21;
  --text-muted: #6a737d;
  --border: #d1d5da;
  --accent: #d32f2f;
  --accent-hover: #b71c1c;

  /* Compatibilidad */
  --fondo-principal: #ffffff;
  --fondo-tarjeta: #ffffff;
  --color-texto: #1c1e21;
  --borde: #d1d5da;
}

/* MODO OSCURO (Solo al activar el alternador) */
[data-theme='dark'],
:root[data-theme='dark'] {
  --bg-main: #0f1215;
  --bg-panel: #161b22;
  --bg-input: #0d1117;
  --text-main: #ffffff;
  --text-muted: #8b949e;
  --border: #30363d;
  --accent: #ff0000;
  --accent-hover: #cc0000;

  /* Compatibilidad */
  --fondo-principal: #0f1215;
  --fondo-tarjeta: #161b22;
  --color-texto: #ffffff;
  --borde: #30363d;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Arial, sans-serif;
  background: var(--bg-main);
  color: var(--text-main);
  overflow-x: hidden;
  transition:
    background 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 20000;
}
</style>
