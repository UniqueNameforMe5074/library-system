export default {
    template: `
      <div v-if="!no_purchases" class="text-center">
        <div class="container" style="padding-top:10px">
          <h1 class="mb-5 display-4">View Purchases</h1>

          <div class="row text-center">
            <div class="col-3">
              <button class="btn btn-primary" @click="$router.push('/librarian_home')">Home</button>
            </div>
            <div class="col-3">
              <label for="filterBook">Filter by Book:</label>
              <input type="text" v-model="filterBook" @input="filterPurchases" />
            </div>
            <div class="col-3">
              <label for="filterUser">Filter by User:</label>
              <input type="text" v-model="filterUser" @input="filterPurchases" />
            </div>
            <div class="col-3">
              <button class="btn btn-danger" @click="log_out">Log Out</button>
            </div>
          </div>

          <table class="table table-bordered table-hover mt-4">
            <thead>
              <tr>
                <th>Purchase ID</th>
                <th>Book Name</th>
                <th>User Name</th>
                <th>Purchase Time</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="purchase in filteredPurchases" :key="purchase.id">
                <td>{{ purchase.purchase_id }}</td>
                <td>{{ purchase.book_name }}</td>
                <td>{{ purchase.user_name }}</td>
                <td>{{ purchase.timestamp }}</td>
                <td>{{ purchase.amount }}</td>
              </tr>
            </tbody>
          </table>

          <p>Can't see a recent change being reflected? Wait a few seconds and reload the page, or try logging out and in again.</p>
        </div>
      </div>

      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">Uh oh, no purchases to display!</h1>
        
        <div style="justify-content: center">
          <button class="btn btn-primary" @click="$router.push('/librarian_home')" style="margin-right: 10px">Home</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
      </div>
    `,
    data() {
      return {
        no_purchases: false, // Has no one bought anything?
        purchases: [], // All purchases
        filteredPurchases: [], // Filtered purchases based on book and user
        filterBook: "", // Input for filtering by book name
        filterUser: "", // Input for filtering by user name
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchPurchases() {
        // Make GET request to fetch all purchases
        const response = await fetch("/api/purchases", {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          this.purchases = await response.json();
          this.filteredPurchases = this.purchases;
        } else {
          this.no_purchases = true; // No one bought anything, or there's an issue
        }
      },
      // Filter purchases based on book name and/or user name
      filterPurchases() {
        this.filteredPurchases = this.purchases.filter(purchase =>
          purchase.book_name.toLowerCase().includes(this.filterBook.toLowerCase()) &&
          purchase.user_name.toLowerCase().includes(this.filterUser.toLowerCase())
        );
      },
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
            this.$router.push('/login');
        } else {
            const responseData = await response.json();
            console.error('Logout failed:', responseData.error_message);
        }
      }
    },
    created() {
      // Fetch all purchases when the component is created
      this.fetchPurchases();
    }
  };
  