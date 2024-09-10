export default {
    template: `
      <div class="container mt-4 text-center" style="max-width:400px">
        <h1 class="display-4 mb-4">Add New Genre</h1>

        <form @submit.prevent="addGenre" class="mb-4">
          <div class="mb-3">
            <label for="genreName" class="form-label">Genre Name:</label>
            <input type="text" id="genreName" v-model="genreName" required />
          </div>
          <button type="submit" class="btn btn-primary">Add Genre</button>
        </form>

        <p v-if="message" :class="{ 'bg-success text-white': success, 'bg-danger text-white': !success }" style="padding: 10px;">
          {{ message }}
        </p>
        
        <div class="mt-2">
          <button class="btn btn-secondary me-2" @click="$router.push('/librarian_home')">Home</button>
          <button class="btn btn-primary" @click="$router.push('/manage_genres')">View All Genres</button>
        </div>
      </div>
    `,
    data() {
      return {
        genreName: '', // Name of new genre
        message: '', // Text for successful genre addition
        success: false, // Whether addition is successful or not
        token: localStorage.getItem('authToken') // Authentication token
      };
    },
    methods: {
      async addGenre() {
        // Make POST request to API's genres endpoint
        const response = await fetch('/api/genres', {
          method: 'POST',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          },
          // Send name of new genre as request body
          body: JSON.stringify({
            name: this.genreName
          })
        });
        
        const response_data = await response.json();
        this.message = response_data.message; // Set message text, whether success or error
        
        if (response.ok) {
          this.success = true; // Addition successful!
        } else {
          this.success = false;
          console.log(this.message); // Addition unsuccessful
        }
      }
    }
};