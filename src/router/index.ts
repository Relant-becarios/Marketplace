import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from '@/views/ProfileView.vue'

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
      path: '/calculadora',
      name: 'calculadora',
      component: () => import('@/views/CalculadoraView.vue'),
    },
    {
      path: '/visor-3d',
      name: 'visor-3d',
      component: () => import('@/views/StlView.vue'),
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: ProfileView,
    },
  ],
})

export default router
