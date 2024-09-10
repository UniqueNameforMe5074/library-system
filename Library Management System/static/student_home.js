export default {
    template: `
      <div v-if="user_found">
        <div v-if="!no_books" class="container mt-4 text-center">
          <h1 class="mb-5 display-4">Welcome, {{ userName }}!</h1>
        
          <div class="btn-group mb-4" style="display: flex; justify-content: center">
            <button @click="$router.push('/user_requests')" class="btn btn-warning me-2">Requests</button>
            <button @click="$router.push('/user_borrowings')" class="btn btn-info me-2">Borrowed Books</button>
            <button @click="$router.push('/user_purchases')" class="btn btn-success me-2">Purchases</button>
            <button @click="log_out" class="btn btn-danger me-2">Log Out</button>
          </div>

          <div class="mb-3 justify-content-between">
            <label for="searchTerm" class="form-label">Search:</label>
            <input type="text" v-model="searchTerm" @input="filterBooks" style="margin-right: 150px" />
            <label for="genre" class="form-label">Filter by Genre:</label>
            <select v-model="selectedGenre" @change="filterBooks" style="margin-right: 150px">
              <option value="">All Genres</option>
              <option v-for="genre in genres" :key="genre.id">{{ genre.name }}</option>
            </select>
          </div>
        
          <div class="row">
            <div v-for="book in filteredBooks" :key="book.id" class="col-lg-4">
              <div class="card mb-3" style="width: 400px; height: 300px; padding: 10px">
                <div class="row">
                  <div class="col-md-6">
                    <img :src="getImageUrl(book.image)" alt="Book Cover" style="width: 150px; height: 200px;" />
                  </div>
                  <div class="card-body col-md-6" style="text-align: center">
                    <h5 class="card-title">{{ book.name }}</h5>
                    <h6 class="card-subtitle text-muted mb-3">{{ book.author }}</h6>
                    <p class="card-text"><b>Genre: </b>{{ book.genre }}</p>
                    <p class="card-text"><b>Price: </b>Rs. {{ book.price }}</p>
                  </div>
                </div>
                <div class="card-footer mt-1 justify-content-between">
                  <button v-if="!book.requested && !book.purchased" @click="requestAccess(book.id, userId)" class="btn btn-primary">Request</button>
                  <button v-else-if="!book.purchased" disabled class="btn btn-secondary">Requested</button>
                  <button v-if="!book.purchased" @click="$router.push('/purchase_book/' + book.id)" class="btn btn-success">Purchase</button>
                  <button v-else disabled class="btn btn-secondary">Purchased</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center mt-5">
          <h1 class="display-3 mb-5">We're out of stock!</h1>
          <h2>We have no books to show you.</h2>
          <div class="d-flex justify-content-center mt-4">
            <button @click="$router.push('/user_requests')" class="btn btn-warning">Requests</button>
            <button @click="$router.push('/user_borrowings')" class="btn btn-info">Borrowed Books</button>
            <button @click="$router.push('/user_purchases')" class="btn btn-success">Purchases</button>
            <button @click="log_out" class="btn btn-danger">Log Out</button>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center mt-5">
        <h1 class="display-3 mb-5">Unable to retrieve user details.</h1>
        <h2>Please try again!</h2>
        <div class="d-flex justify-content-center">
          <button class="btn btn-primary" @click="$router.push('/log_in')">Log In</button>
          <button class="btn btn-primary" @click="$router.push('/signup')">Sign Up</button>
        </div>
      </div>
    `,
    data() {
      return {
        user_found: true, // Whether logged-in user could be retrieved
        no_books: false, // Are there no books?
        userName: '', // Name of currently logged-in user
        userId: 0, // ID of currently logged-in user
        searchTerm: '', // Search term for filtering
        selectedGenre: "", // Genre for filtering
        books: [], // All books
        genres: [], // All genres
        filteredBooks: [], // Filtered books
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
          this.userId = userData.id;
        } else {
          user_found = false; // User couldn't be retrieved
          console.error('Failed to fetch user data');
        }
      },
      async fetchBooks() {
        // Make GET request to retrieve all books
        const response = await fetch('/api/books', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          this.books = await response.json();
          // Check whether each book has been requested, accessed, or bought by currently logged in user
          for (let book of this.books) {
            await this.doBookChecks(book.id);
          }
          this.filteredBooks = this.books;
        } else {
          no_books = true; // There are no books, or there is an error
          console.error('Failed to fetch books');
        }
      },
      async doBookChecks(book_id) {
        // Check whether a book has been requested, accessed, or bought by currently logged in user
        const response = await fetch(`/book_checks/${book_id}`, {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          const bookChecks = await response.json();
      
          const book = this.books.find(book => book.id === book_id);
          if (book) {
            // Update requested status
            book.requested = bookChecks.requested;
            
            // Update purchased status
            book.purchased = bookChecks.purchased;
          }
        } else {
          console.error(`Failed to fetch details for book with ID ${book_id}`);
        }
      },
      async fetchGenres() {
        // Make GET request to fetch all genres
        const response = await fetch("/api/genres", {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
  
        if (response.ok) {
          this.genres = await response.json();
        } else {
          this.no_books = true;
        }
      },
      // Filter books using search term and selected genre
      filterBooks() {
        this.filteredBooks = this.books.filter(book =>
          (book.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
          (this.selectedGenre === "" || book.genre === this.selectedGenre)
      );
      },
      async requestAccess(bookId, userId) {
        // Make POST request to send a new book request
        const response = await fetch(`/api/requests`, { 
            method: 'POST',
            headers: {
              'Authentication-Token': this.token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              book_id: bookId,
              user_id: userId
            })
        });
        if (response.ok) {
          const book = this.books.find(book => book.id === bookId);
          book.requested = true; // Book has been requested successfully
        } else {
          console.error('Failed to request access to book');
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
      // Fetch user data when the component is created
      this.fetchUserData();
      // Fetch all genres when the component is created
      this.fetchGenres();
      // Fetch all books when the component is created
      this.fetchBooks();
    }
};