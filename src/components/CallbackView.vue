<template>
<h1>Callback</h1>
</template>

<script>
import axios from 'axios'
import qs from 'qs'
export default {
  async mounted () {
    console.log(this.$route.query)

    const stateFromQuery = this.$route.query.state
    if (stateFromQuery == null || stateFromQuery !== this.$cookies.get('vueState')) {
      this.$router.push({ name: 'Home' })
    }

    const resp = await axios({
      method: 'POST',
      data: qs.stringify({
        grant_type: 'authorization_code',
        code: this.$route.query.code,
        redirect_uri: this.$spotifyRedirectURL,
        client_id: '203cf6804ed64da2accc7f84ede9118c',
        code_verifier: this.$cookies.get('shaVer')
      }),
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + (btoa('203cf6804ed64da2accc7f84ede9118c:' + '3c0043a696804f0a9003ff93164d372d'))
      }
    })
    this.$cookies.set('access_token', resp.data.access_token)
    let exprDat = new Date()
    exprDat = new Date(exprDat.getTime() + resp.data.expires_in * 1000)
    this.$cookies.set('exprDate', exprDat.toString())
    if (resp.data !== null) {
      this.$router.push({ name: 'Home' })
    }
    console.log(resp)
    // this.$cookies.set('accessToken', this.$route.query.code)
    // this.$router.push({ name: 'Home' })
  }
}
</script>

<style>

</style>
