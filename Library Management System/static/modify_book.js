export default {
  template: `
  <div v-if="!modified">
    <div class="container mt-2" style="max-width:700px">
      <h1 class="mb-4 display-4 text-center">Book Modification: {{ oldBookDetails.name }}</h1>

      <div v-if="oldBookDetails" class="text-center">
        <h4 class="mb-3">Current Information:</h4>
        <div class="row">
          <div class="col">
            <img :src="getImageUrl(oldBookDetails.image)" alt="Book Cover" style="width: 200px; height: 200px;" />
          </div>
          <div class="col mt-4">
            <p><b>Name:</b> {{ oldBookDetails.name }}</p>
            <p><b>Author:</b> {{ oldBookDetails.author }}</p>
            <p><b>Genre:</b> {{ oldBookDetails.genre }}</p>
            <p><b>Price:</b> {{ oldBookDetails.price }}</p>
          </div>
        </div>
      </div>

      <p class="text-center mt-3">Leave a field blank if the corresponding value does not need to be modified.</p>

      <div v-if="errorMessages.length > 0" class="alert alert-danger" role="alert">
        <ul>
          <li v-for="error in errorMessages" :key="error">{{ error }}</li>
        </ul>
      </div>

      <form @submit.prevent="modifyBook">
        <div class="row mb-3">
          <div class="form-group">
            <label for="bookName" class="form-label">New Book Name:</label>
            <input type="text" id="bookName" v-model="newBookName" class="form-control"/>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div class="form-group mb-3">
              <label for="genre" class="form-label">New Genre:</label>
              <input type="text" id="genre" v-model="newGenre" class="form-control"/>
            </div>
            <div class="form-group">
              <label for="imageFilename" class="form-label">New Image (filename):</label>
              <input type="text" id="imageFilename" v-model="newImage" class="form-control" />
            </div>
          </div>
          <div class="col">
            <div class="form-group mb-3">
              <label for="author" class="form-label">New Author:</label>
              <input type="text" id="author" v-model="newAuthor" class="form-control"/>
            </div>
            <div class="form-group">
              <label for="price" class="form-label">New Price:</label>
              <input type="number" id="price" v-model="newPrice" class="form-control"/>
            </div>
          </div>
        </div>
        <div class="row text-center mt-3">
          <div class="d-grid gap-2 col-6">
            <button class="btn btn-primary" type="submit">Submit</button>
          </div>
          <div class="d-grid gap-2 col-4">
            <button class="btn btn-info" @click="$router.push('/manage_ebooks')">All Books</button>
          </div>
          <div class="col-sm">
            <button class="btn btn-danger" @click="log_out">Log Out</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <div v-else class="text-center" style="padding-top:150px">
    <h1 class="display-3 mb-5">{{ oldBookDetails.name }} has been modified.</h1>
    <button class="btn btn-success" @click="$router.push('/librarian_home')">Home</button>
    <button class="btn btn-info" @click="$router.push('/manage_ebooks')">All Books</button>
    <button class="btn btn-danger" @click="log_out">Log Out</button>
  </div>
  `,
  data() {
    return {
      oldBookDetails: null, // Current book details
      newBookName: '', // New book name
      newAuthor: '', // New author name
      newImage: '', // New image filename
      newGenre: '', // New genre
      newPrice: 0, // New price
      errorMessages: [], // Error messages
      modified: false, // Whether the book was successfully modified
      token: localStorage.getItem('authToken') // Authentication token
    };
  },
  methods: {
    async fetchBookDetails() {
      // Make GET request to fetch details of book to be modified
      const response = await fetch(`/api/books/${this.$route.params.id}`, {
        method: 'GET',
        headers: {
          'Authentication-Token': this.token,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        this.oldBookDetails = await response.json();
      } else {
        console.error('Failed to fetch book details');
      }
    },
    // Store any and all modifications, then make a PUT request
    async modifyBook() {
      this.errorMessages = []; // Clear error messages
      const modifications = {};
      if (this.newBookName) {
        modifications.name = this.newBookName;
      } 
      if (this.newAuthor) {
        modifications.author = this.newAuthor;
      }
      if (this.newImage) {
        modifications.image = this.newImage;
      }
      if (this.newGenre) {
        modifications.genre = this.newGenre;
      }
      if (this.newPrice) {
        modifications.price = this.newPrice;
      }

      const response = await fetch(`/api/books/${this.$route.params.id}`, {
        method: 'PUT',
        headers: {
          'Authentication-Token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modifications)
      });

      if (response.ok) {
        this.modified = true; // Modification successful!
      } else {
        const data = await response.json();
        this.errorMessages = data.errors; // Errors in proposed modifications
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
