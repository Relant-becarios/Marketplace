<template>
  <div v-if="uiStore.isMenuOpen" class="menu-overlay" @click="uiStore.toggleMenu">
    <div class="menu-drawer" @click.stop>
      <div class="menu-header">
        <h3>Menú</h3>
        <span class="close-btn" @click="uiStore.toggleMenu">✕</span>
      </div>

      <ul class="menu-list">
        <!-- ÍTEM DE LA IA CON ICONO DE ESTRELLA PERSONALIZADO -->
        <li class="menu-item ai-item" @click="abrirAsistenteAI">
          <img src="/Estrella icono (1).png" class="menu-icon-img" alt="Asistente IA" />
          <span>Asistente IA</span>
        </li>

        <!-- CATÁLOGO DE PRODUCTOS -->
        <li class="menu-item" @click="navegarA('/catalogo')">
          <span class="icon">📦</span>
          <span>Catálogo de Productos</span>
        </li>

        <!-- CALCULADORA DE DOSIFICACIÓN -->
        <li class="menu-item" @click="navegarA('/calculadora')">
          <span class="icon">🧮</span>
          <span>Calculadora de Dosificación</span>
        </li>

        <!-- VISOR STL 3D -->
        <li class="menu-item" @click="navegarA('/visor-3d')">
          <span class="icon">🧊</span>
          <span>Visor STL 3D</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const uiStore = useUiStore()
const router = useRouter()

const abrirAsistenteAI = () => {
  uiStore.toggleMenu()
  uiStore.toggleChat()
}

const navegarA = (ruta: string) => {
  uiStore.toggleMenu()
  router.push(ruta)
}
</script>

<style scoped>
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 25000;
  display: flex;
  justify-content: flex-end;
}
.menu-drawer {
  background: var(--bg-panel, #ffffff);
  width: 280px;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  color: var(--text-main);
}
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 15px;
  margin-bottom: 15px;
}
.close-btn {
  cursor: pointer;
  font-size: 18px;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  background: var(--bg-input);
  transition: background 0.2s ease;
}
.menu-item:hover {
  background: var(--border);
}

.ai-item {
  background: rgba(255, 0, 0, 0.08);
  color: #ff0000;
  border: 1px solid rgba(255, 0, 0, 0.2);
}
.ai-item:hover {
  background: #ff0000;
  color: #ffffff;
}

/* ESTILO PARA LA IMAGEN DEL ICONO DE LA IA */
.menu-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
</style>
