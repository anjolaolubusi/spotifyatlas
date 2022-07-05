<template>
  <n-button @click="LoginToSpotify">Login</n-button>
</template>

<script>
import { NButton } from 'naive-ui'
// import axios from 'axios'
export default {
  name: 'SpotifyData',
  components: {
    NButton
  },
  methods: {
    LoginToSpotify () {
      console.log('Logging in to Spotify')
      window.location.href = 'https://accounts.spotify.com/authorize?client_id=203cf6804ed64da2accc7f84ede9118c&response_type=code&redirect_uri=http://localhost:8080/'
    }
  }
}
</script>

<style>

</style>
