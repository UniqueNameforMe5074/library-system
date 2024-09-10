export default {
    template: `
    <div v-if="user_found">    
      <div v-if="!bought" class="container text-center" style="max-width:700px">
        <h1 class="mb-4 display-4">Book Purchase</h1>

        <div class="row">
          <div class="col">
           <img :src="getImageUrl(book.image)" alt="Book Cover" style="width: 300px; height: 400px;" />
          </div>
          <div class="col mt-4">
            <p><b>Name:</b> {{ book.name }}</p>
            <p><b>Author:</b> {{ book.author }}</p>
            <p><b>Genre:</b> {{ book.genre }}</p>
            <p><b>Price:</b> {{ book.price }}</p>
          </div>
        </div>
        
        <div>
          <p>Are you sure you want to purchase this book?</p>
          <button class="btn btn-success" @click="purchaseBook(book.id, userId, book.price)">Yes</button>
          <button class="btn btn-danger" @click="$router.push('/student_home')">Cancel</button>
        </div>
      </div>

      <div v-else class="container text-center" style="padding-top:150px">
        <h1 class="display-3 mb-5">{{ book.name }} has been purchased!</h1>

        <button class="btn btn-primary" @click="$router.push('/student_home')">Home</button>
        <button @click="$router.push('/user_requests')" class="btn btn-warning">Requests</button>
        <button @click="$router.push('/user_borrowings')" class="btn btn-info">Borrowed Books</button>
        <button @click="$router.push('/user_purchases')" class="btn btn-success">Purchases</button>
        <button @click="log_out" class="btn btn-danger">Log Out</button>
      </div>
    </div>
    `,
    data() {
      return {
        book: {}, // Book details
        userId: 0, // ID of user going to buy the book
        user_found: true, // Whether the logged-in user was successfully retrieved
        bought: false, // Whether the book was purchased
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async fetchUserData() {
        // Retrieve the currently logged in user
        const response = await fetch('/get_user', {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json"
          }
        }); 
        if (response.ok) {
          const userData = await response.json();
          this.userId = userData.id;
        } else {
          this.user_found = false;
          console.error('Failed to fetch user data');
        }
      },
      async fetchBookDetails() {
        // Make GET request to fetch details of the book to be purchased
        const response = await fetch(`/api/books/${this.$route.params.id}`, {
          headers: {
            'Authentication-Token': this.token,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
            this.book = await response.json();
        } else {
            console.error('Failed to fetch book details');
        }
      },
      async purchaseBook(bookId, userId, bookPrice) {
        // Make POST request to purchase the book
        const response = await fetch(`/api/purchases`, { 
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          },
          // Send book ID, user ID, and price as request body
          body: JSON.stringify({
            book_id: bookId,
            buyer_id: userId,
            amount: bookPrice
          }) 
        });
        if (response.ok) {
          this.bought = true; // Purchase successful!
        } else {
          console.error('Failed to purchase book'); // Purchase unsuccessful
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
      // Fetch details of the currently logged-in user
      this.fetchUserData();
      // Fetch book details when the component is created
      this.fetchBookDetails();
    }
};
