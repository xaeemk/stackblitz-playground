import { Home } from '@/pages/home.vine'

import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: () => import('@/pages/about.vine') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
