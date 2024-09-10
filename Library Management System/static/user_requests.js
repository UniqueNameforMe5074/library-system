export default {
    template: `
      <div v-if="!no_requests" class="container text-center" style="max-width: 1200px">
        <h1 class="mt-3 mb-5 display-4">Books You've Requested</h1>
    
        <div class="btn-group mb-4" style="display: flex; justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-info" @click="$router.push('/user_borrowings')">Borrowed Books</button>
          <button class="btn btn-success" @click="$router.push('/user_purchases')">Purchases</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
      
        <table class="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Book Name</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in userRequests" :key="request.request_id" :style="getStyle(request.status)">
              <td>{{ request.book_name }}</td>
              <td>{{ request.timestamp }}</td>
              <td>{{ request.status }}</td>
            </tr>
          </tbody>
        </table>

        <p>Can't see a request you just made? Wait a few seconds and reload the page, or try logging out and in again.</p>
      </div>

      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">No requests made yet!</h1>

        <div style="justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-info" @click="$router.push('/user_borrowings')">Borrowed Books</button>
          <button class="btn btn-success" @click="$router.push('/user_purchases')">Purchases</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
        
        <div class="mt-3 text-center">
          <p>Just made a request? Wait a few seconds and reload the page, or try logging out and in again.</p>  
        </div>
      </div>
    `,
    data() {
      return {
        no_requests: false, // Did the user not request any books?
        userRequests: [], // All user requests
        userName: '', // Name of current user
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchUserData() {
        // Retrieve details of currently logged-in user
        const response = await fetch('/get_user', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
            const userData = await response.json();
            this.userName = userData.username;
        } else {
            console.error('Failed to fetch current user data');
        }
      },
      async fetchUserRequests() {
        // Make GET request to retrieve all requests
        const response = await fetch('/api/requests', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
            const requests = await response.json();
            // Only display those requests that were made by the currently logged-in user
            this.userRequests = requests.filter(request => request.user_name === this.userName);
            if (this.userRequests.length == 0) {
              this.no_requests = true; // User hasn't requested any books
            }
        } else {
            this.no_requests = true; // User hasn't requested any books, or there's an issue
            console.error('Failed to fetch user requests');
        }
      },
      // Get row background colour based on request status
      getStyle(status) {
        switch (status) {
          case 'Pending':
            return { backgroundColor: 'gold' };
          case 'Approved':
            return { backgroundColor: 'lightgreen' };
          case 'Rejected':
            return { backgroundColor: 'lightcoral' };
          case 'Returned':
            return { backgroundColor: 'lightgrey' };
          default:
            return {};
        }
      },
      // Log out the user
      async log_out() {
        const response = await fetch("/log_out", {
            method: "POST",
            headers: {
                'Authentication-Token': this.token,
            },
        });

        if (response.ok) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('role');
            console.log('Logout successful');

            // Redirect to the login page
            this.$router.push('/login');
        } else {
            const responseData = await response.json();
            console.error('Logout failed:', responseData.error_message);
        }
      }
    },
    created() {
      // Fetch current user's data when the component is created
      this.fetchUserData();
      // Fetch user requests when the component is created
      this.fetchUserRequests();
    },
};