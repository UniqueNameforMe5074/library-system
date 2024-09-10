export default {
    template: `
      <div v-if="!no_access" class="container text-center" style="max-width: 1200px">
        <h1 class="mt-3 mb-5 display-4">Books You've Borrowed</h1>
      
        <div class="btn-group mb-4" style="display: flex; justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-warning" @click="$router.push('/user_requests')">Requests</button>
          <button class="btn btn-success" @click="$router.push('/user_purchases')">Purchases</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
      
        <div style="justify-content: center">
          <p>Access to any and all books lasts for a period of 7 days, after which they are automatically returned.</p>
        </div>

        <table class="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Book Name</th>
              <th>Accessed Since</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in userRequests" :key="request.request_id">
              <td>{{ request.book_name }}</td>
              <td>{{ request.timestamp }}</td>
              <td>
                <div style="pointer-events: none">
                  <object width="100%" height="650" type="application/pdf" data="static/test.pdf#zoom=70&toolbar=0&navpanes=0">
                    <p>PDF could not be displayed.</p>
                  </object>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p>Can't see a book you just got access to? Wait a few seconds and reload the page, or try logging out and in again.</p>
      </div>
  
      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">No books borrowed currently!</h1>

        <div style="justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-warning" @click="$router.push('/user_requests')">Requests</button>
          <button class="btn btn-success" @click="$router.push('/user_purchases')">Purchases</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
        
        <div class="mt-3 text-center">
          <p>Just got access to a book? Wait a few seconds and reload the page, or try logging out and in again.</p>  
        </div>
      </div>
    `,
    data() {
      return {
        no_access: false, // Does the user not have access to any books?
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
        // Make GET request to retrieve all user requests
        const response = await fetch('/api/requests', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
            const requests = await response.json();
            // Display only those requests that have been approved
            this.userRequests = requests.filter(request => request.user_name === this.userName)
                                .filter(request => request.status === 'Approved');
            if (this.userRequests.length == 0) {
              this.no_access = true;
            }
        } else {
            this.no_access = true; // User does not have access to any books, or there is an issue
            console.error('Failed to fetch user requests');
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