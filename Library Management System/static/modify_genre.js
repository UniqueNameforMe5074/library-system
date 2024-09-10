export default {
    template: `
      <div v-if="!genreUpdated" class="text-center">
        <div class="container mt-4">
          <h1 class="mb-4 display-4">Genre Modification: {{ genreName }}</h1>

          <form @submit.prevent="submitNewName">
            <div class="mb-3">
              <label for="newGenreName" class="form-label">New Genre Name:</label>
              <input type="text" id="newGenreName" v-model="newGenreName" />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
          </form>

          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <div v-if="genreCount != 0" class="mt-3">
            <p>The following {{ genreCount }} books will be affected by this change.</p>
    
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
            <p>No books will be affected by this change.</p>
          </div>

          <div class="justify-content-between mt-4">
            <button class="btn btn-secondary" @click="$router.push('/librarian_home')">Home</button>
            <button class="btn btn-info" @click="$router.push('/manage_genres')">All Genres</button>
          </div>

        </div>
      </div>
      
      <div v-else class="text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">{{ genreName }} has been modified.</h1>
        <button class="btn btn-success" @click="$router.push('/librarian_home')">Home</button>
        <button class="btn btn-info" @click="$router.push('/manage_genres')">All Genres</button>
        <button class="btn btn-danger" @click="log_out">Log Out</button>
      </div>
    `,
    data() {
      return {
        genreName: '', // Current genre name
        newGenreName: '', // New genre name
        genreCount: 0, // No. of books of that genre
        books: [], // Books of that genre
        genreUpdated: false, // Whether updation was successful
        error: '', // Error message if any
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchGenreDetails() {
        // Make GET request to fetch a particular genre using its ID
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
          // Now, fetch all books of that genre
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
      async submitNewName() {
        // Make PUT request to submit new name for the genre
        const response = await fetch(`/api/genres/${this.$route.params.id}`, {
          method: 'PUT',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: this.newGenreName })
        });
        if (response.ok) {
          this.genreUpdated = true; // Modification successful
        } else {
          response = await response.json()
          this.error = response.error; // Modification unsuccessful, set error message
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
  