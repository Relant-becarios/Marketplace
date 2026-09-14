<template>
  <div class="checkout-container">
    <NavBar />

    <main class="checkout-content">
      <!-- PANTALLA DE ÉXITO TRAS VOLVER DE MERCADO PAGO -->
      <div v-if="pagoExitoso" class="status-card success-card">
        <div class="status-icon">✅</div>
        <h2>¡Pago Procesado con Éxito!</h2>
        <p>
          Tu orden <strong>#REL-{{ idOrden }}</strong> ha sido confirmada.
        </p>
        <p class="status-desc">El inventario ha sido actualizado en la base de datos.</p>
        <button class="btn-primary" @click="$router.push('/catalogo')">Volver al Catálogo</button>
      </div>

      <!-- PANTALLA DE ERROR / FALLO -->
      <div v-else-if="pagoFallido" class="status-card error-card">
        <div class="status-icon">❌</div>
        <h2>Ocurrió un problema con el pago</h2>
        <p class="status-desc">El pago fue rechazado o cancelado. No se hizo ningún cargo.</p>
        <button class="btn-secondary" @click="pagoFallido = false">Intentar de nuevo</button>
      </div>

      <!-- VISTA PRINCIPAL (RESUMEN Y BOTÓN DE PAGO) -->
      <div v-else class="checkout-grid">
        <section class="payment-section">
          <h2>Pagar con Mercado Pago</h2>
          <p class="mp-subtitle">Serás redirigido de forma segura a la plataforma de pago.</p>

          <div v-if="errorMensaje" class="error-banner">⚠️ {{ errorMensaje }}</div>

          <button
            @click="generarPagoMercadoPago"
            :disabled="procesando || cartStore.items.length === 0"
            class="btn-mercadopago"
          >
            {{ procesando ? 'Generando Link...' : 'PAGAR CON MERCADO PAGO' }}
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
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { fetchProductos, type Producto } from '@/api/inventory'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const procesando = ref(false)
const pagoExitoso = ref(false)
const pagoFallido = ref(false)
const idOrden = ref('')
const errorMensaje = ref('')
const productosDetalle = ref<Producto[]>([])

// Base URL del API
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 1. Verificar si el usuario viene regresando de Mercado Pago
onMounted(async () => {
  cargarCatalogo()

  // Si en la URL viene ?status=approved, significa que ya pagó en Mercado Pago
  if (route.query.status === 'approved') {
    await descontarStockEnBackend() // Descontamos de Postgres
    pagoExitoso.value = true
    idOrden.value = String(route.query.payment_id || Math.floor(100000 + Math.random() * 900000))
    cartStore.vaciarCarrito()
    router.replace('/checkout') // Limpiamos la URL
  } else if (route.query.status === 'failure') {
    pagoFallido.value = true
    router.replace('/checkout')
  }
})

const cargarCatalogo = async () => {
  productosDetalle.value = await fetchProductos()
}

// 2. Mapeo detallado del carrito
const itemsConDetalle = computed(() => {
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
      return pId === targetId || pID === targetId
    })
    return {
      id: item.id,
      cant: item.cant,
      nombre: prod?.Producto || item.id,
      precio: parseFloat(String(prod?.Precio || 0)) || 0,
      imagen: prod?.Imagen_URL || prod?.imagen || `https://via.placeholder.com/60`,
    }
  })
})

const totalPrecio = computed(() => {
  return itemsConDetalle.value.reduce((acc, item) => acc + item.precio * item.cant, 0)
})

// 3. Función principal para ir a Mercado Pago
const generarPagoMercadoPago = async () => {
  procesando.value = true
  errorMensaje.value = ''

  try {
    const respuesta = await fetch(`${URL_API}/api/create_preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsConDetalle.value }),
    })

    const data = await respuesta.json()

    if (data.init_point) {
      // Redirigir al link seguro de Mercado Pago
      window.location.href = data.init_point
    } else {
      throw new Error('No se pudo generar el link de pago.')
    }
  } catch (error: unknown) {
    console.error(error)
    errorMensaje.value =
      error instanceof Error ? error.message : 'No se pudo generar el link de pago.'
  } finally {
    procesando.value = false
  }
}

// 4. Función para descontar stock (se llama automáticamente cuando regresan de MP)
const descontarStockEnBackend = async () => {
  if (cartStore.items.length === 0) return

  try {
    await fetch(`${URL_API}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartStore.items.map((item) => ({ id: item.id, cantidad: item.cant })),
      }),
    })
  } catch (error) {
    console.error('Error al descontar stock:', error)
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
  padding: 40px 20px 80px 20px;
}

/* GRID PRINCIPAL (PAGO IZQ, RESUMEN DER) */
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

/* BOTÓN MERCADO PAGO */
.btn-mercadopago {
  width: 100%;
  background: #009ee3;
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

.btn-mercadopago:hover:not(:disabled) {
  background: #0084bd;
}

.btn-mercadopago:disabled {
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

/* CONTENEDOR Y CONTROL DE TAMAÑO DE IMAGEN */
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

/* RESPONSIVO PA RA MÓVILES */
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
