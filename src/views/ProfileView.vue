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
                <span class="order-total">${{ Number(orden.total || 0).toFixed(2) }} USD</span>
              </div>

              <!-- TRACKER CON ÍCONOS -->
              <div class="stepper-container">
                <div :class="['step-item', { active: obtenerNivelStep(orden.estado) >= 1 }]">
                  <div class="step-circle">
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                      ></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      <path d="M9 12h6"></path>
                      <path d="M9 16h6"></path>
                    </svg>
                  </div>
                  <span class="step-title">En preparación</span>
                </div>

                <div
                  :class="['step-line', obtenerNivelStep(orden.estado) >= 2 ? 'solid' : 'dotted']"
                ></div>

                <div :class="['step-item', { active: obtenerNivelStep(orden.estado) >= 2 }]">
                  <div class="step-circle">
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                      ></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <span class="step-title">Empacado</span>
                </div>

                <div
                  :class="['step-line', obtenerNivelStep(orden.estado) >= 3 ? 'solid' : 'dotted']"
                ></div>

                <div :class="['step-item', { active: obtenerNivelStep(orden.estado) >= 3 }]">
                  <div class="step-circle">
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  </div>
                  <span class="step-title">En camino</span>
                </div>

                <div
                  :class="['step-line', obtenerNivelStep(orden.estado) >= 4 ? 'solid' : 'dotted']"
                ></div>

                <div :class="['step-item', { active: obtenerNivelStep(orden.estado) >= 4 }]">
                  <div class="step-circle">
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <span class="step-title">Entregado</span>
                </div>
              </div>

              <div class="order-items" v-if="orden.items && orden.items.length">
                <div v-for="item in orden.items" :key="item.id" class="order-item-mini">
                  <span class="item-qty">{{ item.cant || item.cantidad || 1 }}x</span>
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
              :key="obtenerSkuProducto(fav)"
              class="prod-card"
            >
              <img :src="obtenerImagenProducto(fav)" :alt="fav.Producto || 'Producto'" />
              <h4>{{ fav.Producto || (fav as ProductoExtendido).Descripcion }}</h4>
              <p class="price">${{ Number(fav.Precio || 0).toFixed(2) }} USD</p>

              <button
                class="btn-action"
                :disabled="obtenerStockProducto(fav) <= 0"
                @click="agregarAlCarrito(fav)"
              >
                {{ obtenerStockProducto(fav) <= 0 ? 'Agotado' : 'Añadir al carrito' }}
              </button>
            </div>
          </div>
        </div>

        <!-- HISTORIAL DE NAVEGACIÓN -->
        <div v-if="tabActiva === 'recientes'" class="tab-content">
          <div v-if="vistosRecientemente.length === 0" class="empty-box">
            <p>No tienes productos en tu historial de navegación reciente.</p>
          </div>

          <div v-else class="products-grid">
            <div
              v-for="prod in vistosRecientemente"
              :key="obtenerSkuProducto(prod)"
              class="prod-card"
            >
              <img :src="obtenerImagenProducto(prod)" :alt="prod.Producto || 'Producto'" />
              <h4>{{ prod.Producto || (prod as ProductoExtendido).Descripcion }}</h4>
              <p class="price">${{ Number(prod.Precio || 0).toFixed(2) }} USD</p>

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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { useMarketStore, type ProductoExtendido } from '@/stores/market'
import type { Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, get } from 'firebase/database'
import NavBar from '@/components/NavBar.vue'

interface ItemOrden {
  id: string
  cant?: number
  cantidad?: number
  nombre?: string
}

interface Orden {
  id: string
  fecha?: string
  total: number
  estado?: string
  items?: ItemOrden[]
}

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const marketStore = useMarketStore()

const tabActiva = ref<string>('pedidos')
const pedidos = ref<Orden[]>([])

// Lectura reactiva inmediata desde el store global
const vistosRecientemente = computed(() => marketStore.historial)

const usuarioInicial = computed(() => {
  const nombre = authStore.perfil?.nombre || authStore.usuarioActual?.email || 'U'
  return nombre.charAt(0).toUpperCase()
})

const cambiarTab = (tab: string) => {
  tabActiva.value = tab
  if (tab === 'recientes' || tab === 'favoritos') {
    cargarDatos()
  }
}

const obtenerNivelStep = (estado = '') => {
  const st = estado.toLowerCase()
  if (st.includes('entregado') || st.includes('delivered')) return 4
  if (
    st.includes('camino') ||
    st.includes('transito') ||
    st.includes('transit') ||
    st.includes('enviado')
  )
    return 3
  if (st.includes('empacado') || st.includes('packed') || st.includes('listo')) return 2
  return 1
}

const obtenerSkuProducto = (prod: Producto): string => {
  const pExt = prod as ProductoExtendido
  return String(
    pExt.id ||
      pExt.ID ||
      pExt.SKU ||
      pExt['no. De parte'] ||
      pExt.NO_DE_PARTE ||
      pExt.Producto ||
      '',
  ).trim()
}

const obtenerStockProducto = (prod: Producto): number => {
  const pExt = prod as ProductoExtendido
  const sku = obtenerSkuProducto(prod).toLowerCase()

  const prodEnVivo = marketStore.productos.find((p) => {
    const pE = p as ProductoExtendido
    const pSku = String(
      pE.id || pE.ID || pE.SKU || pE['no. De parte'] || pE.NO_DE_PARTE || pE.Producto || '',
    )
      .trim()
      .toLowerCase()
    return pSku === sku
  })

  const stockRaw = prodEnVivo?.Stock ?? pExt.Stock
  return typeof stockRaw === 'number' ? stockRaw : parseInt(String(stockRaw || 0), 10) || 0
}

const obtenerImagenProducto = (prod: Producto): string => {
  const pExt = prod as ProductoExtendido
  const img =
    pExt.Imagen_URL ||
    pExt.Imagen ||
    pExt.imagen ||
    pExt.IMAGEN ||
    pExt.Foto ||
    pExt.URL ||
    pExt.url
  return typeof img === 'string' && img.trim() !== ''
    ? img.trim()
    : 'https://via.placeholder.com/150'
}

const agregarAlCarrito = (prod: Producto) => {
  const sku = obtenerSkuProducto(prod)
  const stock = obtenerStockProducto(prod)

  if (stock <= 0) return

  cartStore.agregarProducto(sku, stock, 1)
  uiStore.toggleCart()
}

const volverAVer = (prod: Producto) => {
  marketStore.openModal(prod)
  router.push('/catalogo')
}

const cargarDatos = async () => {
  if (!authStore.usuarioActual) return
  const uid = authStore.usuarioActual.uid

  try {
    if (marketStore.productos.length === 0) {
      await marketStore.cargarProductos()
    }

    // Sincroniza el historial persistido de Firebase al store
    await marketStore.cargarHistorialFirebase()

    const snapPedidos = await get(dbRef(db, `ordenes/${uid}`))
    if (snapPedidos.exists()) {
      const rawPedidos = Object.values(snapPedidos.val()) as Orden[]
      pedidos.value = rawPedidos.reverse()
    }

    await favoritesStore.cargarFavoritos()
  } catch (e: unknown) {
    console.error('Error al cargar datos del perfil desde Firebase:', e)
  }
}

watch(
  () => authStore.usuarioActual,
  (usuario) => {
    if (usuario) {
      cargarDatos()
    }
  },
  { immediate: true },
)

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
  background: var(--accent, #e52e2e);
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
  color: var(--accent, #e52e2e);
  border-bottom-color: var(--accent, #e52e2e);
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
  background: #f0f3f5;
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  padding: 24px 30px;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.order-id {
  font-weight: 800;
  font-size: 1.1rem;
  margin-right: 12px;
}

.order-date {
  font-size: 0.88rem;
  color: var(--text-muted, #6a737d);
}

.order-total {
  font-weight: 900;
  color: var(--accent, #e52e2e);
  font-size: 1.15rem;
}

.stepper-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 30px 10px 35px 10px;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
  min-width: 80px;
}

.step-circle {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #8b939c;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.step-item.active .step-circle {
  background: #e52e2e;
}

.step-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #7f8c8d;
  text-align: center;
}

.step-item.active .step-title {
  color: #e52e2e;
}

.step-line {
  flex: 1;
  height: 6px;
  margin: 0 -5px 25px -5px;
  z-index: 1;
  border-radius: 3px;
}

.step-line.solid {
  background: #e52e2e;
}

.step-line.dotted {
  background: radial-gradient(circle, #8b939c 35%, transparent 35%);
  background-size: 12px 12px;
  background-position: center;
}

.order-items {
  border-top: 1px dashed #d1d5da;
  padding-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.88rem;
}

.order-item-mini {
  display: flex;
  gap: 6px;
  font-weight: 700;
}

.item-qty {
  color: var(--text-main);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}

.prod-card {
  background: var(--bg-input, #eef2f5);
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
  color: var(--accent, #e52e2e);
  font-weight: 800;
  margin-bottom: 10px;
}

.btn-action {
  width: 100%;
  background: var(--accent, #e52e2e);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s ease;
}

.btn-action:hover:not(:disabled) {
  background: #c22525;
}

.btn-action:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  margin-top: 80px;
}

.btn-login-prompt {
  background: var(--accent, #e52e2e);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
}

@media (max-width: 680px) {
  .step-circle {
    width: 46px;
    height: 46px;
  }
  .step-circle svg {
    width: 20px;
    height: 20px;
  }
  .step-title {
    font-size: 0.72rem;
  }
}
</style>
