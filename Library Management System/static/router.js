import add_book from './add_book.js'
import add_genre from './add_genre.js'
import delete_book from './delete_book.js'
import delete_genre from './delete_genre.js'
import first_page from './first_page.js'
import librarian_home from './librarian_home.js'
import log_in from './log_in.js'
import manage_ebooks from './manage_ebooks.js'
import manage_genres from './manage_genres.js'
import manage_requests from './manage_requests.js'
import modify_book from './modify_book.js'
import modify_genre from './modify_genre.js'
import purchase_book from './purchase_book.js'
import signup from './signup.js'
import student_home from './student_home.js'
import user_borrowings from './user_borrowings.js'
import user_purchases from './user_purchases.js'
import user_requests from './user_requests.js'
import view_purchases from './view_purchases.js'

const routes = [
    { path: '/', component: first_page },
    { path: '/add_book', component: add_book },
    { path: '/add_genre', component: add_genre },
    { path: '/delete_book/:id', component: delete_book },
    { path: '/delete_genre/:id', component: delete_genre },
    { path: '/librarian_home', component: librarian_home },
    { path: '/log_in', component: log_in },
    { path: '/manage_ebooks', component: manage_ebooks },
    { path: '/manage_genres', component: manage_genres },
    { path: '/manage_requests', component: manage_requests },
    { path: '/modify_book/:id', component: modify_book },
    { path: '/modify_genre/:id', component: modify_genre },
    { path: '/purchase_book/:id', component: purchase_book},
    { path: '/signup', component: signup },
    { path: '/student_home', component: student_home },
    { path: '/user_borrowings', component: user_borrowings },
    { path: '/user_purchases', component: user_purchases },
    { path: '/user_requests', component: user_requests },
    { path: '/view_purchases', component: view_purchases },
]

export default new VueRouter({
    routes
}) 