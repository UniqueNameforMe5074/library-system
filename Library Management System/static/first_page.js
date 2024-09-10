export default {
    template: `
      <div class="container" style="max-width: 600px; padding-top: 250px; text-align: center">
        <div class="row">

          <div class="col-md-3" style="padding-right: 50px">
            <img :src="'static/images/books_left.png'" alt="ImageLeft" style="width: 250%"/>
          </div>

          <div class="col-md-6" style="padding-left: 60px">
            <div style="font-size: 36px; font-weight: bold; color: #007bff; margin-bottom: 20px">Welcome!</div>
            <div class="lead" style="font-size: 18px; color: #333; margin-bottom: 30px">This is my second app dev project. :)</div>
            <div style="justify-content: center">
              <button class="btn btn-primary me-2" @click="$router.push('/log_in')">Log In</button>
              <button class="btn btn-primary me-2" @click="$router.push('/signup')">Sign Up</button>
            </div>
          </div>
          
          <div class="col-md-3">
            <img :src="'static/images/books_right.png'" alt="ImageRight" style="width: 180px; height: 180px"/>
          </div>
        </div>
      </div>
    `
};