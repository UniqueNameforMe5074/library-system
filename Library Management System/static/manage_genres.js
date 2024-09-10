export default {
    template: `
      <div v-if="!no_genres" class="text-center">
        <div class="container" style="padding-top:10px">
          <h1 class="mb-5 display-4">Manage Genres</h1>
      
          <div class="row justify-content-between my-4">
            <div class="col-4">
              <button class="btn btn-success" @click="$router.push('/add_genre')">Add a Genre</button>
            </div>
            <div class="col-4">
              <input type="text" class="form-control" v-model="searchTerm" placeholder="Search by Genre Name" @input="filterGenres" />
            </div>
            <div class="col-4">
              <button class="btn btn-primary" @click="$router.push('/librarian_home')">Home</button>
            </div>
          </div>
      
          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>Genre ID</th>
                <th>Genre Name</th>
                <th>No. of Books</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="genre in filteredGenres" :key="genre.id">
                <td>{{ genre.id }}</td>
                <td>{{ genre.name }}</td>
                <td>{{ genre.count }}</td>
                <td>
                  <button type="button" class="btn btn-warning btn-sm" @click="$router.push('/modify_genre/' + genre.id)" style="margin-right: 10px">Modify</button>
                  <button type="button" class="btn btn-danger btn-sm" @click="$router.push('/delete_genre/' + genre.id)" style="margin-left: 10px">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>

          <p>Can't see a recent change being reflected? Wait a few seconds and reload the page, or try logging out and in again.</p>
        </div>
      </div>
      
      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">Uh oh, no genres to display!</h1>
        <div style="justify-content: center">
          <button class="btn btn-success" @click="$router.push('/add_genre')" style="margin-right: 10px">Add a Genre</button>
          <button class="btn btn-primary" @click="$router.push('/librarian_home')" style="margin-right: 10px">Home</button>
          <button class="btn btn-danger" @click="log_out">Log Out</button>
        </div>
      </div>
    `,
    data() {
      return {
        no_genres: false, // Are there no genres?
        genres: [], // All genres
        filteredGenres: [], // Filtered genres based on search term
        searchTerm: "", // Search term
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchGenres() {
        // Make GET request to fetch all genres
        const response = await fetch("/api/genres", {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          },
        });
        if (response.ok) {
          this.genres = await response.json();
          this.filteredGenres = this.genres;
        } else {
            this.no_genres = true; // There are no genres! Or there is an issue
        }
      },
      // Filter genres based on search term
      filterGenres() {
        this.filteredGenres = this.genres.filter(genre =>
          genre.name.toLowerCase().includes(this.searchTerm.toLowerCase())
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
      // Fetch all genres when the component is created
      this.fetchGenres();
    }
}; 