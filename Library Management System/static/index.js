import router from './router.js'

// Nothing except for the homepage, signup page, or login page can be accessed by unauthenticated users 
router.beforeEach((to, from, next) => {
  if (to.path !== '/log_in' && to.path !== '/signup' && to.path !== '/' && !localStorage.getItem('authToken') ? true : false)
    next({ path: '/log_in' })
  else next()
})

new Vue({
    el: '#app',
    template: `
      <div>
        <router-view />
      </div>
    `,
    mounted() {
      document.body.style.backgroundColor = '#f8f9fa'; // Set background colour of all pages
    },
    router
}) 