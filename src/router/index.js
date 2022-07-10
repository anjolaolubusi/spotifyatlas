import { createRouter, createWebHistory } from 'vue-router'
import SpotifyData from '../components/SpotifyData'
import CallbackView from '../components/CallbackView'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: SpotifyData
  },
  {
    path: '/callback:queryParams(.*)',
    name: 'CallbackView',
    component: CallbackView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
