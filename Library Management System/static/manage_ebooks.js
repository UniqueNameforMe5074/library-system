export default {
  template: `
    <div v-if="!no_books" class="container mt-4 text-center">
      <h1 class="mb-5 display-4">Manage Books</h1>

      <div class="justify-content-between mb-4">
        <button @click="$router.push('/add_book')" class="btn btn-primary" style="margin-left: 50px; margin-right: 150px">Add New E-book</button>
        <label for="search" class="form-label">Search:</label>
        <input type="text" v-model="search" @input="filterBooks" style="margin-right: 150px" />
        <label for="genre" class="form-label">Filter by Genre:</label>
        <select v-model="selectedGenre" @change="filterBooks" style="margin-right: 150px">
          <option value="">All Genres</option>
          <option v-for="genre in genres" :key="genre.id">{{ genre.name }}</option>
        </select>
        <button @click="$router.push('/librarian_home')" class="btn btn-dark">Home</button>
      </div>

      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Author</th>
            <th>Image</th>
            <th>Genre</th>
            <th>Price</th>
            <th>Statistics</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filteredBooks" :key="book.id">
            <td>{{ book.id }}</td>
            <td>{{ book.name }}</td>
            <td>{{ book.author }}</td>
            <td style="text-align:center"><img :src="getImageUrl(book.image)" alt="Book Cover" style="width: 150px; height: 200px;" /></td>
            <td>{{ book.genre }}</td>
            <td>{{ book.price }}</td>
            <td><b>{{ book.pending_count }}</b> requests pending.<br>
                <b>{{ book.accessed_count }}</b> users currently allowed access.<br>
                <b>{{ book.bought_count }}</b> users with ownership.</td>
            <td>
              <button @click="$router.push('/modify_book/' + book.id)" class="btn btn-sm btn-warning">Modify</button>
              <button @click="$router.push('/delete_book/' + book.id)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <p>Can't see a recent change being reflected? Wait a few seconds and reload the page, or try logging out and in again.</p>
    </div>

    <div v-else class="text-center mt-5">
      <h1 class="display-3 mb-5">Uh oh, no books to display!</h1>

      <div class="d-flex justify-content-center">
        <button class="btn btn-success me-3" @click="$router.push('/add_book')">Add a Book</button>
        <button class="btn btn-primary me-3" @click="$router.push('/librarian_home')">Home</button>
        <button class="btn btn-danger" @click="log_out">Log Out</button>
      </div>
    </div>
  `,
  data() {
    return {
      no_books: false, // Are there no books?
      books: [], // All books
      filteredBooks: [], // Filtered books based on search and genre
      search: "", // Search term
      selectedGenre: "", // Selected genre for filtering
      genres: [], // All genres
      token: localStorage.getItem('authToken') // Authentication token
    };
  },
  methods: {
    async fetchBooks() {
      // Make GET request to retrieve all books
      const response = await fetch("/api/books", {
        headers: {
          'Authentication-Token': this.token,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        this.books = await response.json();
        this.filteredBooks = this.books;
      } else {
          this.no_books = true; // There are no books! Or there's an issue
      }
    },
    async fetchGenres() {
      // Make GET request to retrieve all genres
      const response = await fetch("/api/genres", {
        headers: {
          'Authentication-Token': this.token,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        this.genres = await response.json();
      } else {
        this.no_books = true; // There are no books! Or there's an issue
      }
    },
    // Filter books based on search and genre
    filterBooks() {
      this.filteredBooks = this.books.filter(book =>
        (book.name.toLowerCase().includes(this.search.toLowerCase()) ||
        book.author.toLowerCase().includes(this.search.toLowerCase())) &&
        (this.selectedGenre === "" || book.genre === this.selectedGenre)
      );
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
    // Fetch all books and genres when the component is created
    this.fetchGenres();
    this.fetchBooks();
  }
};
