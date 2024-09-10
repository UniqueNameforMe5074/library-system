export default {
    template: `
      <div class="container mt-4" style="text-align: center">
        <div class="row justify-content-center">
          <div class="col-md-auto">  
            <h1 class="mb-5 display-4">Welcome, Librarian! :)</h1>

            <ul class="list-group">
              <li class="list-group-item mb-5" style="font-size: 24px; background-color: #ffff66">
                <router-link to="/manage_requests" class="text-dark" style="display: inline-block;text-decoration:none;">Manage Requests</router-link>
              </li>
              <li class="list-group-item mb-5" style="font-size: 24px; background-color: #99ccff">
                <router-link to="/manage_ebooks" class="text-dark" style="display: inline-block;text-decoration:none;">Manage E-Books</router-link>
              </li>
              <li class="list-group-item mb-5" style="font-size: 24px; background-color: #8cff66">
                <router-link to="/manage_genres" class="text-dark" style="display: inline-block;text-decoration:none;">Manage Genres</router-link>
              </li>
              <li class="list-group-item mb-5" style="font-size: 24px; background-color: #ff99dd">
                <router-link to="/view_purchases" class="text-dark" style="display: inline-block;text-decoration:none;">View Purchases</router-link>
              </li>
            </ul>
            
            <button class="btn btn-danger btn-lg" @click="log_out">Log Out</button>
          </div>
        </div>
      </div>
    `,
    methods: {
      // Log out the user
      async log_out() {
        const response = await fetch("/log_out", {
            method: "POST",
            headers: {
                'Authentication-Token': this.authToken,
            },
        });

        if (response.ok) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('role');
            console.log('Logout successful');

            // Redirect to the login page
            this.$router.push('/log_in');
        } else {
            const responseData = await response.json();
            console.error('Logout failed:', responseData.error_message);
        }
      },
    },
};
  