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
    path: '/spotifyatlas/',
    name: 'HomeProd',
    component: SpotifyData
  },
  {
    path: '/callback/:queryParams(.*)',
    name: 'CallbackView',
    component: CallbackView
  },
  {
    path: '/spotifyatlas/callback/:queryParams(.*)',
    name: 'CallbackViewProd',
    component: CallbackView
  }
]

const router = createRouter({
  mode: 'history',
  history: createWebHistory(),
  routes
})

export default router
