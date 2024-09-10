export default {
    template: `
      <div v-if="!success" class="container text-center" style="max-width:700px">
        <h1 class="mb-4 display-4">Book Deletion</h1>
        <h4 class="mb-3">Book Information:</h4>

        <div class="row">
          <div class="col">
            <img :src="getImageUrl(book.image)" alt="Book Cover" style="width: 200px; height: 200px;" />
          </div>
          <div class="col mt-4">
            <p><b>Name:</b> {{ book.name }}</p>
            <p><b>Author:</b> {{ book.author }}</p>
            <p><b>Genre:</b> {{ book.genre }}</p>
            <p><b>Price:</b> {{ book.price }}</p>
          </div>
        </div>
        <div>
            <p><b>All requests and purchases involving this book will be annulled.</b></p>
            <p>Are you sure you want to proceed with deletion?</p>
            <button class="btn btn-success" @click="deleteBook">Yes</button>
            <button class="btn btn-danger" @click="$router.push('/manage_ebooks')">Cancel</button>
        </div>
      </div>
      
      <div v-else class="container text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">{{ book.name }} has been removed.</h1>
        <button class="btn btn-success" @click="$router.push('/librarian_home')">Home</button>
        <button class="btn btn-info" @click="$router.push('/manage_ebooks')">All Books</button>
        <button class="btn btn-danger" @click="log_out">Log Out</button>
      </div>
    `,
    data() {
      return {
        book: {}, // Details of book to be deleted
        success: false, // Whether deletion was successful or not
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchBookDetails() {
        // Make GET request to retrieve details of a particular book
        const response = await fetch(`/api/books/${this.$route.params.id}`, {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
            this.book = await response.json(); // Set book details
        } else {
            console.error('Failed to fetch book details');
        }
      },
      async deleteBook() {
        // Make DELETE request for that particular book
        const response = await fetch(`/api/books/${this.$route.params.id}`, {
          method: 'DELETE',
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        });
  
        if (response.ok) {
            this.success = true; // Deletion successful!
        } else {
            console.error('Failed to delete genre'); // Deletion unsuccessful
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
      // Fetch book details when the component is created
      this.fetchBookDetails();
    }
};