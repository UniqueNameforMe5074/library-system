export default {
    template: `
      <div v-if="!success" class="container text-center" style="max-width:1000px">
        <h1 class="mb-4 display-4">Genre Deletion: {{ genreName }}</h1>

        <div v-if="genreCount != 0" class="mt-3">
          <p>The following <b>{{ genreCount }}</b> books, along with their associated requests and purchases, <b>will be deleted upon this removal</b>.</p>

          <table class="table table-bordered table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Author</th>
                <th>Image</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in books" :key="book.id">
                <td>{{ book.id }}</td>
                <td>{{ book.name }}</td>
                <td>{{ book.author }}</td>
                <td><img :src="getImageUrl(book.image)" alt="Book Cover" style="width: 50px; height: 50px;" /></td>
                <td>{{ book.price }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="mt-3">
          <p>No books will be affected by this removal.</p>
        </div>

        <p>Are you sure you want to delete this category?</p>
        <button class="btn btn-success" @click="deleteGenre">Yes</button>
        <button class="btn btn-danger" @click="$router.push('/manage_genres')">Cancel</button>
      </div>
      
      <div v-else class="text-center" style="margin-top:150px">
        <h1 class="display-3 mb-5">{{ genreName }} has been removed.</h1>
        <button class="btn btn-success" @click="$router.push('/librarian_home')">Home</button>
        <button class="btn btn-info" @click="$router.push('/manage_genres')">All Genres</button>
        <button class="btn btn-danger" @click="log_out">Log Out</button>
      </div>
    `,
    data() {
      return {
        genreName: '', // Name of genre to be deleted
        genreCount: 0, // No. of books of that genre
        books: [], // Books of that genre
        success: false, // Whether deletion was successful
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async deleteGenre() {
        // Make DELETE request to API's genres endpoint
        const response = await fetch(`/api/genres/${this.$route.params.id}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          this.success = true; // Deletion successful!
        } else {
          console.error('Failed to delete genre'); // Deletion unsuccessful
        }
      },
      async fetchGenreDetails() {
        // Make GET request to retrieve all genres
        const response = await fetch(`/api/genres/${this.$route.params.id}`, {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          this.genreName = data.name;
          this.genreCount = data.count;
          // Now, retrieve all books of that genre
          const next_response = await fetch(`/api/books/${this.genreName}`, {
            method: 'GET',
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            this.books = await next_response.json();
          } else {
            console.error('Failed to fetch books')
          }
        } else {
          console.error('Failed to fetch genre details');
        }
      },
      // Retrieve URL of that book's image
      getImageUrl(imageFilename) {
        return `/static/images/${imageFilename}`;
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
      // Fetch genre details and associated books when the component is created
      this.fetchGenreDetails();
    }
  };  
  