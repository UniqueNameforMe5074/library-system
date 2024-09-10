export default {
  template: `
    <div v-if="!no_requests" class="container text-center" style="max-width:1200px">
      <h1 class="mt-2 mb-5 display-4">Manage Requests</h1>

      <div class="row text-center mb-3">
        <div class="col-2">
          <button class="btn btn-primary" @click="$router.push('/librarian_home')">Home</button>
        </div>
        <div class="col-4">
          <label for="filterBook" class="form-label">Filter by Book:</label>
          <input type="text" v-model="filterBook" @input="filterRequests" />
        </div>
        <div class="col-4">
          <label for="filterUser" class="form-label">Filter by User:</label>
          <input type="text" v-model="filterUser" @input="filterRequests" />
        </div>
        <div class="col-2">
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
      </div>

      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Book Name</th>
            <th>User Name</th>
            <th>Request Time</th>
            <th>Status</th>
            <th>Last Update Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.request_id">
            <td :style="getStyle(request.status)">{{ request.request_id }}</td>
            <td :style="getStyle(request.status)">{{ request.book_name }}</td>
            <td :style="getStyle(request.status)">{{ request.user_name }}</td>
            <td :style="getStyle(request.status)">{{ request.timestamp }}</td>
            <td :style="getStyle(request.status)">{{ request.status }}</td>
            <td :style="getStyle(request.status)">{{ request.last_status_update }}</td>
            <td :style="getStyle(request.status)">
              <button @click="acceptRequest(request.request_id)" class="btn btn-success" :disabled="request.status !== 'Pending'">Approve</button>
              <button @click="rejectRequest(request.request_id)" class="btn btn-danger" :disabled="request.status !== 'Pending'">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p>Can't see a recent change being reflected? Wait a few seconds and reload the page, or try logging out and in again.</p>
    </div>
    
    <div v-else class="text-center" style="padding-top:150px">
      <h1 class="display-3 mb-5">No requests made!</h1>
      <div style="justify-content: center">
        <button class="btn btn-primary" @click="$router.push('/librarian_home')" style="margin-right: 10px">Home</button>
        <button class="btn btn-danger" @click="log_out">Log Out</button>
      </div>
    </div>
  `,
  data() {
    return {
      no_requests: false, // Are there no requests?
      requests: [], // All requests
      filteredRequests: [], // Filtered requests based on user input
      filterBook: "", // Input for filtering by book name
      filterUser: "", // Input for filtering by user name
      token: localStorage.getItem('authToken') // Authentication token
    };
  },
  methods: {
    // Fetch all requests initially
    async fetchRequests() {
      // Make GET request to fetch all requests
      const response = await fetch("/api/requests", {
        headers: {
          'Authentication-Token': this.token,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        this.requests = await response.json();
        this.filteredRequests = this.requests;
      } else {
          this.no_requests = true; // There are no requests! Or there is an issue
      }
    },
    // Filter requests based on book name and/or user name
    filterRequests() {
      this.filteredRequests = this.requests.filter(request =>
        request.book_name.toLowerCase().includes(this.filterBook.toLowerCase()) &&
        request.user_name.toLowerCase().includes(this.filterUser.toLowerCase())
      );
    },
    // Accept a request
    async acceptRequest(requestId) {
      await this.updateRequestStatus(requestId, 'Approved');
    },
    // Reject a request
    async rejectRequest(requestId) {
      await this.updateRequestStatus(requestId, 'Rejected');
    },
    // Update the status of a request
    async updateRequestStatus(requestId, status) {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authentication-Token': this.token,
          'Content-Type': 'application/json'
        },
        // Send new status as request body
        body: JSON.stringify({
          'status': status
        })
      });

      if (response.ok) {
        // Update the local requests array
        const updatedRequest = this.requests.find(request => request.request_id === requestId);
        if (updatedRequest) {
          updatedRequest.status = status;
        }

        // Update the filteredRequests array
        this.filterRequests();
      }
    },
    // Get row background colour based on request status
    getStyle(status) {
      let colour;
      switch (status) {
        case 'Pending':
          colour = 'gold'
          return `backgroundColor: ${colour}`;
        case 'Approved':
          colour = 'palegreen';
          return `backgroundColor: ${colour}`;
        case 'Rejected':
          colour = 'lightcoral';
          return `backgroundColor: ${colour}`;
        case 'Returned':
          colour = 'lightgrey';
          return `backgroundColor: ${colour}`;
        default:
          return '';
      }
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
    // Fetch all requests when the component is created
    this.fetchRequests();
  }
};
