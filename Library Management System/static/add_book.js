export default {
    template: `
      <div class="container mt-4" style="max-width:500px">
        <h1 class="mb-5 display-4" style="text-align: center">Add a Book</h1>

        <form @submit.prevent="addBook" class="mb-4">
          <div class="mb-3">
            <label for="bookName" class="form-label">Book Name:</label>
            <input type="text" id="bookName" v-model="bookName" required class="form-control" />
          </div>
          <div class="mb-3">
            <label for="author" class="form-label">Author:</label>
            <input type="text" id="author" v-model="author" required class="form-control" />
          </div>
          <div class="mb-3">
            <label for="image" class="form-label">Image Filename:</label>
            <input type="text" id="image" v-model="image" required class="form-control" />
          </div>
          <div class="mb-3">
            <label for="genre" class="form-label">Genre:</label>
            <input type="text" id="genre" v-model="genre" required class="form-control" />
          </div>
          <div class="mb-3">
            <label for="price" class="form-label">Price:</label>
            <input type="number" id="price" v-model="price" required class="form-control" />
          </div>
          <div style="text-align: center">
            <button type="submit" class="btn btn-primary">Add Book</button>
          </div>
        </form>

        <div v-if="success" class="bg-success text-white pt-3 pb-1" style="text-align: center;">
          <p class="text-align:center">{{ message }}</p>
        </div>

        <p v-if="errors.length !=0 && !success" class="bg-danger text-white px-2 pt-3 pb-1">
          <ul>
            <li v-for="error in errors" :key="error">{{ error }}</li>
          </ul>
        </p>
        
        <div class="d-flex justify-content-between mt-2">
          <button class="btn btn-info" @click="$router.push('/manage_ebooks')">View All Books</button>
          <button class="btn btn-dark" @click="$router.push('/librarian_home')">Home</button>
        </div>
      </div>
    `,
    data() {
      return {
        bookName: '', // Name of new book
        author: '', // Author of new book
        image: '', // Image filename of new book
        genre: '', // Genre of new book
        price: 0, // Price of new book
        message: '', // Text for successful book addition
        success: false, // Whether addition is successful or not
        errors: [], // Error messages, if any
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async addBook() {
        // Make POST request to API's books endpoint
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          },
          // Send new book details as request body
          body: JSON.stringify({
            name: this.bookName,
            author: this.author,
            image: this.image,
            genre: this.genre,
            price: this.price
          })
        });

        if (response.ok) {
            const response_data = await response.json();
            this.message = response_data.message; // Set success message text
            this.success = true; // Addition successful!
        } else {
            const response_data = await response.json();
            this.errors = response_data.errors; // Set error text
            this.success = false; // Addition unsuccessful
        }
      }
    }
};