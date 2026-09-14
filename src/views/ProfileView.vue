<template>
  <div>
    <NavBar />

    <div class="profile-page">
      <div class="profile-container" v-if="authStore.usuarioActual">
        <!-- CABECERA DE PERFIL -->
        <div class="profile-header">
          <div class="avatar">{{ usuarioInicial }}</div>
          <div class="user-details">
            <h2>
              {{ authStore.perfil?.nombre || 'Usuario' }}
              {{ authStore.perfil?.apellidos || '' }}
            </h2>
            <p class="email-text">✉️ {{ authStore.usuarioActual.email }}</p>
          </div>
        </div>

        <!-- NAVEGACIÓN ENTRE PESTAÑAS -->
        <div class="profile-tabs">
          <button
            :class="['tab-btn', { active: tabActiva === 'pedidos' }]"
            @click="cambiarTab('pedidos')"
          >
            📦 Mis Pedidos ({{ pedidos.length }})
          </button>
          <button
            :class="['tab-btn', { active: tabActiva === 'favoritos' }]"
            @click="cambiarTab('favoritos')"
          >
            ❤️ Favoritos ({{ favoritesStore.favoritos.length }})
          </button>
          <button
            :class="['tab-btn', { active: tabActiva === 'recientes' }]"
            @click="cambiarTab('recientes')"
          >
            👁️ Historial de Navegación ({{ vistosRecientemente.length }})
          </button>
        </div>

        <!-- MIS PEDIDOS -->
        <div v-if="tabActiva === 'pedidos'" class="tab-content">
          <div v-if="pedidos.length === 0" class="empty-box">
            <p>Aún no has realizado ninguna compra o cotización.</p>
          </div>

          <div v-else class="orders-list">
            <div v-for="orden in pedidos" :key="orden.id" class="order-card">
              <div class="order-card-header">
                <div>
                  <span class="order-id">Orden #{{ orden.id }}</span>
                  <span class="order-date">{{ orden.fecha || 'Fecha reciente' }}</span>
                </div>
                <span class="order-total">${{ Number(orden.total || 0).toFixed(2) }} MXN</span>
              </div>

              <div class="tracker-container">
                <div class="tracker-bar">
                  <div
                    class="tracker-progress"
                    :style="{ width: obtenerPorcentaje(orden.estado) }"
                  ></div>
                </div>
                <div class="tracker-steps">
                  <div :class="['step', { active: obtenerNivelStep(orden.estado) >= 1 }]">
                    <div class="dot"></div>
                    <span>En preparación</span>
                  </div>
                  <div :class="['step', { active: obtenerNivelStep(orden.estado) >= 2 }]">
                    <div class="dot"></div>
                    <span>En camino</span>
                  </div>
                  <div :class="['step', { active: obtenerNivelStep(orden.estado) >= 3 }]">
                    <div class="dot"></div>
                    <span>Entregado</span>
                  </div>
                </div>
              </div>

              <div class="order-items" v-if="orden.items && orden.items.length">
                <div v-for="item in orden.items" :key="item.id" class="order-item-mini">
                  <span class="item-qty">{{ item.cant }}x</span>
                  <span class="item-name">{{ item.nombre || item.id }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FAVORITOS -->
        <div v-if="tabActiva === 'favoritos'" class="tab-content">
          <div v-if="favoritesStore.favoritos.length === 0" class="empty-box">
            <p>No has guardado productos en tus favoritos.</p>
          </div>

          <div v-else class="products-grid">
            <div
              v-for="fav in favoritesStore.favoritos"
              :key="String(fav.id || fav.Producto)"
              class="prod-card"
            >
              <img
                :src="fav.Imagen_URL || fav.imagen || 'https://via.placeholder.com/150'"
                :alt="fav.Producto || fav.nombre || 'Producto'"
              />
              <h4>{{ fav.Producto || fav.nombre }}</h4>
              <p class="price">${{ Number(fav.Precio || 0).toFixed(2) }} USD</p>
              <button class="btn-action" @click="agregarAlCarrito(String(fav.id || fav.Producto))">
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>

        <!-- HISTORIAL RECIENTE -->
        <div v-if="tabActiva === 'recientes'" class="tab-content">
          <div v-if="vistosRecientemente.length === 0" class="empty-box">
            <p>No tienes productos en tu historial de navegación reciente.</p>
          </div>

          <div v-else class="products-grid">
            <div
              v-for="prod in vistosRecientemente"
              :key="String(prod.id || prod.Producto)"
              class="prod-card"
            >
              <img
                :src="prod.Imagen_URL || prod.imagen || 'https://via.placeholder.com/150'"
                :alt="prod.Producto || prod.nombre || 'Producto'"
              />
              <h4>{{ prod.Producto || prod.nombre }}</h4>
              <p class="price">${{ Number(prod.Precio || 0).toFixed(2) }} USD</p>

              <!-- ABRE LA FICHA TÉCNICA Y LLEVA AL CATÁLOGO -->
              <button class="btn-action" @click="volverAVer(prod)">Volver a ver</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="login-prompt">
        <h2>Debes iniciar sesión para consultar tu perfil.</h2>
        <button class="btn-login-prompt" @click="uiStore.toggleAuthModal">INICIAR SESIÓN</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { useMarketStore } from '@/stores/market'
import type { Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, get } from 'firebase/database'
import NavBar from '@/components/NavBar.vue'

interface ItemOrden {
  id: string
  cant: number
  nombre?: string
}

interface Orden {
  id: string
  fecha?: string
  total: number
  estado?: string
  items?: ItemOrden[]
}

interface ProductoPerfil {
  id: string
  Producto?: string
  nombre?: string
  Precio?: number
  Imagen_URL?: string
  imagen?: string
  [key: string]: unknown
}

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const marketStore = useMarketStore()

const tabActiva = ref<'pedidos' | 'favoritos' | 'recientes'>('pedidos')
const pedidos = ref<Orden[]>([])
const vistosRecientemente = ref<ProductoPerfil[]>([])

const usuarioInicial = computed(() => {
  const nombre = authStore.perfil?.nombre || authStore.usuarioActual?.email || 'U'
  return nombre.charAt(0).toUpperCase()
})

const cambiarTab = (tab: 'pedidos' | 'favoritos' | 'recientes') => {
  tabActiva.value = tab
  if (tab === 'recientes') {
    cargarHistorialLocal()
  }
}

const cargarHistorialLocal = () => {
  try {
    const storageRecientes = localStorage.getItem('relant_recent_items')
    if (storageRecientes) {
      vistosRecientemente.value = JSON.parse(storageRecientes) as ProductoPerfil[]
    }
  } catch (e) {
    console.error('Error cargando historial reciente:', e)
  }
}

const obtenerNivelStep = (estado: string = '') => {
  const st = estado.toLowerCase()
  if (st.includes('entregado')) return 3
  if (st.includes('camino') || st.includes('enviado')) return 2
  return 1
}

const obtenerPorcentaje = (estado: string = '') => {
  const nivel = obtenerNivelStep(estado)
  if (nivel === 3) return '100%'
  if (nivel === 2) return '50%'
  return '10%'
}

const agregarAlCarrito = (id: string) => {
  cartStore.agregarProducto(id)
  uiStore.toggleCart()
}

// LLEVA AL CATÁLOGO Y ABRE EL MODAL DEL PRODUCTO
const volverAVer = (prod: ProductoPerfil) => {
  marketStore.openModal(prod as unknown as Producto)
  router.push('/catalogo')
}

const cargarDatos = async () => {
  cargarHistorialLocal()

  if (!authStore.usuarioActual) return
  const uid = authStore.usuarioActual.uid

  try {
    const snapPedidos = await get(dbRef(db, `ordenes/${uid}`))
    if (snapPedidos.exists()) {
      pedidos.value = Object.values(snapPedidos.val()) as Orden[]
    }
  } catch (e) {
    console.error('Error al cargar datos del perfil:', e)
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.profile-page {
  padding: 30px 5%;
  min-height: 85vh;
  background: var(--bg-main, #f4f6f8);
  color: var(--text-main, #1c1e21);
}

.profile-container {
  max-width: 950px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  margin-bottom: 25px;
}

.avatar {
  width: 65px;
  height: 65px;
  background: var(--accent, #d32f2f);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 800;
}

.user-details h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
}

.email-text {
  margin: 4px 0 0 0;
  color: var(--text-muted, #6a737d);
  font-size: 0.9rem;
}

.profile-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 2px solid var(--border, #d1d5da);
  margin-bottom: 25px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 12px 18px;
  color: var(--text-muted, #6a737d);
  font-weight: 700;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.tab-btn.active {
  color: var(--accent, #d32f2f);
  border-bottom-color: var(--accent, #d32f2f);
}

.tab-content {
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  padding: 25px;
}

.empty-box {
  text-align: center;
  color: var(--text-muted, #6a737d);
  padding: 50px 0;
  font-style: italic;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: var(--bg-input, #e9ecef);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 10px;
  padding: 20px;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.order-id {
  font-weight: 800;
  font-size: 1.05rem;
  margin-right: 12px;
}

.order-date {
  font-size: 0.85rem;
  color: var(--text-muted, #6a737d);
}

.order-total {
  font-weight: 800;
  color: var(--accent, #d32f2f);
  font-size: 1.1rem;
}

.tracker-container {
  margin: 20px 0;
  position: relative;
}

.tracker-bar {
  height: 6px;
  background: var(--border, #d1d5da);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.tracker-progress {
  height: 100%;
  background: var(--accent, #d32f2f);
  transition: width 0.4s ease;
}

.tracker-steps {
  display: flex;
  justify-content: space-between;
  margin-top: -10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted, #6a737d);
  font-weight: 600;
}

.step.active {
  color: var(--accent, #d32f2f);
}

.step .dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--border, #d1d5da);
  border: 2px solid var(--bg-panel, #ffffff);
}

.step.active .dot {
  background: var(--accent, #d32f2f);
}

.order-items {
  border-top: 1px dashed var(--border, #d1d5da);
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.85rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}

.prod-card {
  background: var(--bg-input, #e9ecef);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.prod-card img {
  width: 100%;
  height: 130px;
  object-fit: contain;
  background: #ffffff;
  border-radius: 6px;
  padding: 5px;
}

.prod-card h4 {
  font-size: 0.9rem;
  margin: 10px 0 5px 0;
  line-height: 1.2;
}

.prod-card .price {
  color: var(--accent, #d32f2f);
  font-weight: 800;
  margin-bottom: 10px;
}

.btn-action {
  width: 100%;
  background: var(--accent, #d32f2f);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.8rem;
}

.login-prompt {
  text-align: center;
  margin-top: 80px;
}

.btn-login-prompt {
  background: var(--accent, #d32f2f);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
}
</style>
