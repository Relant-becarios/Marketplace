<template>
  <div class="product-card" @click="openModal">
    <!-- BOTÓN DE FAVORITOS ELEGANTE -->
    <button
      class="btn-fav"
      :class="{ active: isFav }"
      @click.stop="handleToggleFav"
      :title="isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'"
    >
      <svg class="heart-icon" viewBox="0 0 24 24">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </button>

    <div class="img-wrapper">
      <img
        :src="producto.Imagen_URL || 'https://via.placeholder.com/200'"
        :alt="producto.Producto"
      />
    </div>

    <div class="card-body">
      <span class="category-badge">{{ producto.Categoría || 'General' }}</span>
      <h3 class="product-title">{{ producto.Producto }}</h3>

      <p class="sku-text">
        SKU:
        {{
          producto.SKU ||
          producto.id ||
          producto['no_ De parte'] ||
          producto['NO. DE PARTE'] ||
          'N/A'
        }}
      </p>
      <div class="card-footer">
        <span class="price">${{ Number(producto.Precio || 0).toFixed(2) }} USD</span>
        <button class="btn-cart-add" @click.stop="agregarAlCarrito">Añadir</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Producto } from '@/api/inventory'
import { useMarketStore } from '@/stores/market'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  producto: Producto
}>()

const marketStore = useMarketStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isFav = computed(() => favoritesStore.esFavorito(props.producto))

const handleToggleFav = () => {
  if (!authStore.usuarioActual) {
    uiStore.toggleAuthModal()
    return
  }
  favoritesStore.toggleFavorito(props.producto)
}

const openModal = () => {
  marketStore.openModal(props.producto)
}

const agregarAlCarrito = () => {
  const idProducto = String(props.producto.id || props.producto.SKU || props.producto.Producto)
  cartStore.agregarProducto(idProducto)
  uiStore.toggleCart()
}
</script>

<style scoped>
.product-card {
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* BOTÓN DE FAVORITOS ESTILIZADO */
.btn-fav {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.btn-fav:hover {
  transform: scale(1.1);
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.heart-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #718096;
  stroke-width: 2;
  transition: all 0.25s ease;
}

.btn-fav:hover .heart-icon {
  stroke: #ff0000;
}

.btn-fav.active {
  background: rgba(255, 235, 235, 0.95);
  border-color: rgba(255, 0, 0, 0.25);
  box-shadow: 0 4px 14px rgba(255, 0, 0, 0.25);
  animation: heartPop 0.3s ease-out;
}

.btn-fav.active .heart-icon {
  fill: #ff0000;
  stroke: #ff0000;
}

@keyframes heartPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(1);
  }
}

/* SOPORTE PARA MODO OSCURO */
:global([data-theme='dark']) .btn-fav {
  background: rgba(24, 27, 31, 0.85);
  border-color: #30363d;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

:global([data-theme='dark']) .btn-fav:hover {
  background: #22262b;
}

:global([data-theme='dark']) .heart-icon {
  stroke: #a0a6ac;
}

:global([data-theme='dark']) .btn-fav.active {
  background: rgba(255, 0, 0, 0.18);
  border-color: rgba(255, 0, 0, 0.4);
}

.img-wrapper {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.img-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.category-badge {
  font-size: 11px;
  font-weight: 800;
  color: #ff0000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-title {
  font-size: 14px;
  font-weight: 700;
  margin: 6px 0 4px 0;
  line-height: 1.3;
  color: var(--text-main);
}

.sku-text {
  font-size: 11px;
  color: var(--text-muted, #6a737d);
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price {
  font-size: 16px;
  font-weight: 900;
  color: #ff0000;
}

.btn-cart-add {
  background: var(--bg-input, #eef2f5);
  color: var(--text-main);
  border: 1px solid var(--border, #d1d5da);
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cart-add:hover {
  background: #ff0000;
  color: #ffffff;
  border-color: #ff0000;
}
</style>
