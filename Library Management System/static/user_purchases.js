export default {
    template: `
      <div v-if="!no_purchases" class="container text-center" style="max-width: 1200px">
        <h1 class="mt-3 mb-5 display-4">Books You've Bought</h1>

        <div class="btn-group mb-4" style="display: flex; justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-warning" @click="$router.push('/user_requests')">Requests</button>
          <button class="btn btn-info" @click="$router.push('/user_borrowings')">Borrowed Books</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>

        <table class="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Book</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="purchase in userPurchases" :key="purchase.purchase_id">
              <td>{{ purchase.book_name }}</td>
              <td>{{ purchase.amount }}</td>
              <td><button type="submit" onclick="window.open('static/test.pdf')">Download</button></td>
            </tr>
          </tbody>
        </table>

        <p>Can't see a book you just bought? Wait a few seconds and reload the page, or try logging out and in again.</p>
      </div>

      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">No books bought!</h1>

        <div style="justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
          <button class="btn btn-warning" @click="$router.push('/user_requests')">Requests</button>
          <button class="btn btn-info" @click="$router.push('/user_borrowings')">Borrowed Books</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
        
        <div class="mt-3 text-center">
          <p>Just bought a book? Wait a few seconds and reload the page, or try logging out and in again.</p>
        </div>
      </div>
    `,
    data() {
      return {
        no_purchases: false, // Did the user not buy any books?
        userPurchases: [], // All user purchases
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
      async fetchUserPurchases() {
        // Make GET request to retrieve all purchases
        const response = await fetch('/api/purchases', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
            const purchases = await response.json();
            // Only display those purchases that were made by the currently logged-in user
            this.userPurchases = purchases.filter(purchase => purchase.user_name === this.userName);
            if (this.userPurchases.length == 0) {
              this.no_purchases = true; // User hasn't bought any books
            }
        } else {
            this.no_purchases = true; // User hasn't bought any books, or there is an issue
            console.error('Failed to fetch user purchases');
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
      // Fetch user purchases when the component is created
      this.fetchUserPurchases();
    },
};