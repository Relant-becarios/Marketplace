<template>
  <div class="checkout-container">
    <NavBar />

    <main class="checkout-content">
      <!-- BOTÓN DE VOLVER (FLECHITA) -->
      <button class="btn-back" @click="$router.push('/catalogo')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="back-icon"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al catálogo
      </button>

      <!-- PANTALLA DE ÉXITO TRAS CONFIRMAR LA ORDEN -->
      <div v-if="pagoExitoso" class="status-card success-card">
        <div class="status-icon">✅</div>
        <h2>¡Orden Procesada con Éxito!</h2>
        <p>
          Tu pedido <strong>#{{ idOrden }}</strong> ha sido confirmado y guardado en tu cuenta.
        </p>
        <p class="status-desc">Pronto nos pondremos en contacto contigo para el envío.</p>
        <button class="btn-primary" @click="$router.push('/perfil')">Ver mis pedidos</button>
      </div>

      <!-- PANTALLA DE ERROR / FALLO -->
      <div v-else-if="errorMensaje && !procesando" class="status-card error-card">
        <div class="status-icon">❌</div>
        <h2>Ocurrió un problema</h2>
        <p class="status-desc">{{ errorMensaje }}</p>
        <button class="btn-secondary" @click="errorMensaje = ''">Intentar de nuevo</button>
      </div>

      <!-- VISTA PRINCIPAL (RESUMEN Y BOTÓN DE CONFIRMACIÓN) -->
      <div v-else class="checkout-grid">
        <section class="payment-section">
          <h2>Finalizar Pedido</h2>
          <p class="mp-subtitle">Confirma tu orden para registrarla en el sistema.</p>

          <!-- Formulario de datos básicos -->
          <div class="user-info-box">
            <p>
              <strong>Cliente:</strong>
              {{ authStore.perfil?.nombre || authStore.usuarioActual?.email || 'Usuario' }}
            </p>
            <p><strong>Correo:</strong> {{ authStore.usuarioActual?.email }}</p>
          </div>

          <button
            @click="procesarOrdenLocal"
            :disabled="procesando || itemsConDetalle.length === 0"
            class="btn-confirmar"
          >
            {{ procesando ? 'Procesando orden...' : 'CONFIRMAR Y GENERAR ORDEN' }}
          </button>
        </section>

        <!-- Resumen del Pedido (Items del Carrito) -->
        <aside class="summary-section">
          <h3>Resumen del Pedido</h3>

          <div v-if="itemsConDetalle.length === 0" class="empty-summary">
            No hay productos en el carrito.
          </div>

          <div v-else class="items-list">
            <div v-for="item in itemsConDetalle" :key="item.id" class="summary-item">
              <div class="item-img-wrapper">
                <img :src="item.imagen" :alt="item.nombre" class="item-img" />
              </div>
              <div class="item-info">
                <h4 class="item-title">{{ item.nombre }}</h4>
                <div class="item-meta">
                  <span class="item-qty">Cant: {{ item.cant }}</span>
                  <span class="item-price">${{ item.precio.toFixed(2) }} USD</span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-divider"></div>

          <div class="summary-total-row">
            <span>Total Estimado:</span>
            <span class="total-amount">${{ totalPrecio.toFixed(2) }} USD</span>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { fetchProductos, type Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, set } from 'firebase/database'
import NavBar from '@/components/NavBar.vue'

const cartStore = useCartStore()
const authStore = useAuthStore()

const procesando = ref(false)
const pagoExitoso = ref(false)
const idOrden = ref('')
const errorMensaje = ref('')
const productosDetalle = ref<Producto[]>([])

// Expresión regular para limpiar llaves en Firebase
const INVALID_KEY_REGEX = new RegExp('[.#$\\[\\]/]', 'g')

onMounted(() => {
  cargarCatalogo()
})

const cargarCatalogo = async () => {
  productosDetalle.value = await fetchProductos()
}

// Mapeo detallado del carrito
const itemsConDetalle = computed(() => {
  if (!cartStore.items) return []

  return cartStore.items.map((item) => {
    const targetId = String(item.id || '')
      .trim()
      .toLowerCase()
    const prod = productosDetalle.value.find((p) => {
      const pId = String(p.id || '')
        .trim()
        .toLowerCase()
      const pID = String(p.ID || '')
        .trim()
        .toLowerCase()
      const pSKU = String(p.SKU || '')
        .trim()
        .toLowerCase()
      return pId === targetId || pID === targetId || pSKU === targetId
    })
    return {
      id: item.id,
      cant: item.cant || 1,
      nombre: prod?.Producto || item.id,
      precio: parseFloat(String(prod?.Precio || 0)) || 0,
      imagen: prod?.Imagen_URL || `https://via.placeholder.com/60`,
    }
  })
})

const totalPrecio = computed(() => {
  return itemsConDetalle.value.reduce((acc, item) => acc + item.precio * item.cant, 0)
})

// Sanitizador para Firebase (evita errores con puntos y caracteres especiales)
const sanitizeForFirebase = (data: unknown): unknown => {
  if (data === null || data === undefined) return null
  if (typeof data !== 'object') return data
  if (Array.isArray(data)) return data.map(sanitizeForFirebase)

  const obj = data as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val !== undefined) {
      const cleanKey = key.replace(INVALID_KEY_REGEX, '_').trim()
      if (cleanKey !== '') {
        sanitized[cleanKey] = sanitizeForFirebase(val)
      }
    }
  }
  return sanitized
}

// PROCESAR ORDEN EN FIREBASE Y DESCONTAR STOCK EN GOOGLE SHEETS
const procesarOrdenLocal = async () => {
  if (!authStore.usuarioActual) {
    errorMensaje.value = 'Debes iniciar sesión para procesar la orden.'
    return
  }

  procesando.value = true
  errorMensaje.value = ''

  const uid = authStore.usuarioActual.uid
  const generatedId = 'ORD-' + Date.now()

  const nuevaOrden = {
    id: generatedId,
    fecha: new Date().toLocaleDateString('es-MX'),
    total: totalPrecio.value,
    estado: 'En preparación',
    items: itemsConDetalle.value.map((i) => ({
      id: String(i.id),
      cant: i.cant,
      nombre: i.nombre,
      precio: i.precio,
    })),
  }

  try {
    // 1. Guardar la orden en Firebase
    const ordenLimpia = sanitizeForFirebase(nuevaOrden)
    await set(dbRef(db, `ordenes/${uid}/${generatedId}`), ordenLimpia)

    // 2. Descontar stock en Google Sheets
    await descontarStockEnBackend()

    // 3. Vaciar carrito y mostrar éxito
    cartStore.vaciarCarrito()
    idOrden.value = generatedId
    pagoExitoso.value = true
  } catch (error: unknown) {
    console.error('Error al generar la orden:', error)
    errorMensaje.value = 'No se pudo guardar la orden. Revisa tu conexión a internet.'
  } finally {
    procesando.value = false
  }
}

// FUNCIÓN QUE LLAMA AL WEBHOOK DE GOOGLE SHEETS
const descontarStockEnBackend = async () => {
  if (itemsConDetalle.value.length === 0) return

  // URL exacta de tu Google Apps Script
  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxo8Bk1BWaCGV8ASqSTpwjqYzzzark-mt--YhhHBXqm5Ws4CY7ja9vTv52uooKYRM78/exec'

  try {
    // Usamos text/plain para evitar bloqueos de CORS en el navegador
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        items: itemsConDetalle.value.map((item) => ({ id: item.id, cantidad: item.cant })),
      }),
    })
    console.log('Petición de stock enviada a Google Sheets exitosamente.')
  } catch (error) {
    console.error('Error al intentar descontar stock en Google Sheets:', error)
  }
}
</script>

<style scoped>
.checkout-container {
  min-height: 100vh;
  background-color: var(--bg-main, #f4f6f8);
  color: var(--text-main, #1c1e21);
}

.checkout-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 20px 80px 20px;
}

/* BOTÓN VOLVER (FLECHITA) */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-muted, #6a737d);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 25px;
  padding: 0;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.btn-back:hover {
  color: var(--accent, #ff0000);
  transform: translateX(-5px);
}

/* GRID PRINCIPAL */
.checkout-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
  align-items: start;
}

.payment-section,
.summary-section {
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.payment-section h2,
.summary-section h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 8px;
}

.mp-subtitle {
  color: var(--text-muted, #6a737d);
  font-size: 0.9rem;
  margin-bottom: 25px;
}

.user-info-box {
  background: var(--bg-input, #f8f9fa);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--border, #e2e8f0);
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.user-info-box p {
  margin: 5px 0;
}

/* BOTÓN CONFIRMAR */
.btn-confirmar {
  width: 100%;
  background: #009ee3; /* Color azul estilo pasarela, cámbialo a #ff0000 si prefieres rojo */
  color: #ffffff;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}

.btn-confirmar:hover:not(:disabled) {
  background: #0084bd;
}

.btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ERROR BANNER */
.error-banner {
  background: #fff0f0;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

/* LISTA DE PRODUCTOS (CARRITO) */
.empty-summary {
  text-align: center;
  color: var(--text-muted, #6a737d);
  padding: 30px 0;
  font-style: italic;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 6px;
  margin-top: 15px;
}

.items-list::-webkit-scrollbar {
  width: 5px;
}
.items-list::-webkit-scrollbar-thumb {
  background-color: var(--border, #d1d5da);
  border-radius: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border, #eef2f5);
}

.summary-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-img-wrapper {
  width: 65px;
  height: 65px;
  min-width: 65px;
  background: #ffffff;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.item-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  line-height: 1.3;
  color: var(--text-main);
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-qty {
  font-size: 0.8rem;
  color: var(--text-muted, #6a737d);
  font-weight: 600;
}

.item-price {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--accent, #ff0000);
}

/* DIVIDER Y TOTALES */
.order-divider {
  border-top: 2px dashed var(--border, #d1d5da);
  margin: 20px 0;
}

.summary-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 800;
}

.total-amount {
  color: var(--accent, #ff0000);
  font-size: 1.25rem;
  font-weight: 900;
}

/* TARJETAS DE ESTADO (ÉXITO / FALLO) */
.status-card {
  text-align: center;
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  padding: 50px 30px;
  border-radius: 16px;
  max-width: 520px;
  margin: 40px auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.status-icon {
  font-size: 55px;
  margin-bottom: 15px;
}

.status-card h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.status-desc {
  color: var(--text-muted, #6a737d);
  font-size: 0.95rem;
  margin-bottom: 25px;
}

.btn-primary,
.btn-secondary {
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background: var(--accent, #ff0000);
  color: #ffffff;
}

.btn-secondary {
  background: var(--bg-input, #eef2f5);
  color: var(--text-main);
  border: 1px solid var(--border, #d1d5da);
}

.btn-primary:hover,
.btn-secondary:hover {
  opacity: 0.9;
}

@media (max-width: 850px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .payment-section {
    order: 2;
  }
  .summary-section {
    order: 1;
  }
}
</style>
