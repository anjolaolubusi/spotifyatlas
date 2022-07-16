import { createRouter, createWebHistory } from 'vue-router'
import SpotifyData from '../components/SpotifyData'
import CallbackView from '../components/CallbackView'
import TestView from '../components/TestView'

const routes = [
  {
    path: '/',
    alias: ['/spotifyatlas/'],
    name: 'Home',
    component: SpotifyData
  },
  {
    path: '/Test',
    name: 'Test',
    component: TestView
  },
  {
    path: '/callback/:queryParams(.*)?',
    name: 'CallbackView',
    alias: ['/spotifyatlas/callback/:queryParams(.*)?'],
    component: CallbackView,
    props: true
  }
]

const router = createRouter({
  mode: 'history',
  history: createWebHistory(),
  routes
})

export default router
