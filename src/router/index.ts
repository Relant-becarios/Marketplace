import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/catalogo',
      name: 'catalogo',
      component: () => import('@/views/CatalogoView.vue'),
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('@/views/ProfileView.vue'),
    },
    // RUTA DE CHECKOUT AGREGADA
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
    },
    {
      path: '/calculadora',
      name: 'calculadora',
      component: () => import('@/views/CalculadoraView.vue'),
    },
    {
      path: '/visor-3d',
      name: 'visor3d',
      component: () => import('@/views/StlView.vue'),
    },
  ],
})

export default router
