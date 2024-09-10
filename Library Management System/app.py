################################ Project Info ################################################

################### Sections #################

## 1. Imports
## 2. App Configuration
## 3. Task & Email Configuration
## 4. Data Models
## 5. Security Setup
## 6. API Resources
## 7. Celery Tasks
## 8. Miscellaneous Functions

################### Commands #################

## 1. Redis: redis-server
## 2. MailHog: ~/go/bin/MailHog
## 3. Worker: celery -A app:celery_app worker --loglevel=INFO
## 4. Beat: celery -A app:celery_app beat --loglevel=INFO

##############################################################################################


################################## Imports ###################################################

################### Flask ####################

from flask import Flask, render_template, request, jsonify, make_response
from flask_caching import Cache
from flask_restful import Resource, Api, abort, reqparse, fields, marshal_with
from flask_security import UserMixin, RoleMixin, SQLAlchemyUserDatastore, Security, auth_required, roles_required, login_user, logout_user, current_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

############ Tasks & Schedules ###############

from celery import Celery, Task
from celery.schedules import crontab
from datetime import date, datetime

#################### Emails ##################

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from smtplib import SMTP

##############################################################################################


############################# App Configuration ##############################################

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['SQLALCHEMY_DATABASE_URI'] = "your_db_url"
app.config['SECRET_KEY'] = "your_secret_key"
app.config['SECURITY_PASSWORD_SALT'] = "your_salt"
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'
app.config['WTF_CSRF_ENABLED'] = False
app.config['CACHE_TYPE'] = "RedisCache"
app.config['CACHE_REDIS_HOST'] = "localhost"
app.config['CACHE_REDIS_DB'] = 3

db = SQLAlchemy(app)
api = Api(app, prefix='/api')
cache = Cache(app)

##############################################################################################


######################### Task & Email Configuration #########################################

def celery_init_app(app):
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask,
                        broker="redis://localhost:6379/1",
                        backend="redis://localhost:6379/2",  
                        timezone="Asia/Kolkata",
                        broker_connection_retry_on_startup=True)
    return celery_app

celery_app = celery_init_app(app)

def send_message(to, subject, content_body):
    msg = MIMEMultipart()
    msg["To"] = to
    msg["Subject"] = subject
    msg["From"] = 'your_email_id'
    msg.attach(MIMEText(content_body, 'plain'))
    client = SMTP(host='localhost', port=1025)
    client.send_message(msg=msg)
    client.quit()

##############################################################################################


################################### Data Models ##############################################

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    name = db.Column(db.String(10), unique=True, nullable=False)
    description = db.Column(db.String(50))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, nullable=False)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
    last_login_date = db.Column(db.Date)
    roles = db.relationship('Role', secondary='roles_users', backref=db.backref('users', lazy='dynamic'))
    user_req_rel = db.relationship('Request', back_populates='req_user_rel')
    user_buy_rel = db.relationship('Purchase', back_populates='buy_user_rel')

class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey(User.id))
    role_id = db.Column(db.Integer(), db.ForeignKey(Role.id))

class Genre(db.Model):
    id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    count = db.Column(db.Integer(), default=0)
    genre_book_rel = db.relationship('Book', back_populates='book_genre_rel')

class Book(db.Model):
    id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    name = db.Column(db.String(30), unique=True, nullable=False)
    author = db.Column(db.String(20), nullable=False)
    image = db.Column(db.String(255), nullable=False)
    genre = db.Column(db.String(20), db.ForeignKey(Genre.name))
    price = db.Column(db.Integer(), nullable=False)
    pending_count = db.Column(db.Integer(), default=0)
    accessed_count = db.Column(db.Integer(), default=0)
    bought_count = db.Column(db.Integer(), default=0)
    book_genre_rel = db.relationship('Genre', back_populates='genre_book_rel')
    book_req_rel = db.relationship('Request', back_populates='req_book_rel')
    book_buy_rel = db.relationship('Purchase', back_populates='buy_book_rel')

class Request(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_id = db.Column(db.Integer, db.ForeignKey(Book.id))
    user_id = db.Column(db.Integer, db.ForeignKey(User.id))
    timestamp = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='Pending')
    last_status_update = db.Column(db.DateTime, onupdate=datetime.now)
    req_user_rel = db.relationship('User', back_populates='user_req_rel')
    req_book_rel = db.relationship('Book', back_populates='book_req_rel') 
 
class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_id = db.Column(db.Integer, db.ForeignKey(Book.id))
    buyer_id = db.Column(db.Integer, db.ForeignKey(User.id))
    timestamp = db.Column(db.DateTime)
    amount = db.Column(db.Integer, nullable=False)
    buy_user_rel = db.relationship('User', back_populates='user_buy_rel')
    buy_book_rel = db.relationship('Book', back_populates='book_buy_rel')

##############################################################################################


################################# Security Setup #############################################

datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, datastore)

with app.app_context():
    db.create_all()
    datastore.find_or_create_role(name="Librarian", description="Manages e-books, requests, and purchases.")
    datastore.find_or_create_role(name="Student", description="Can browse, request access to, and buy, e-books.")
    if not datastore.find_user(email="librarian@gmail.com"):
        datastore.create_user(username="Librarian", roles=["Librarian"], 
                              email="librarian@gmail.com", password=generate_password_hash("librarian_password"))
    db.session.commit()

##############################################################################################
        

################################# API Resources ##############################################

book_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'author': fields.String,
    'image': fields.String,
    'genre': fields.String,
    'price': fields.Integer,
    'pending_count': fields.Integer,
    'accessed_count': fields.Integer,
    'bought_count': fields.Integer
}

class BookResource(Resource):
    @marshal_with(book_fields)
    @auth_required("token")
    @cache.memoize(60)
    def get(self, book_id=None, genre_name=None):

        ## Retrieving a particular book for modification, deletion or purchase
        if book_id:
            book = Book.query.filter_by(id=book_id).first()
            if not book:
                abort(404, message='No book found')
            return book
        
        ## Retrieving books of a particular genre to display effects of modification or deletion of said genre
        elif genre_name:
            genre = Genre.query.filter_by(name=genre_name).first()
            books = Book.query.filter_by(genre=genre.name).all()
            return books
        
        ## Retrieving all books to display to librarian and students  
        else:    
            books = Book.query.all()
            if not books:
                abort(404, message='No books found')
            return books

    # Adding a new book
    @auth_required("token")
    @roles_required('Librarian')
    def post(self):

        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True, help='Name is required')
        parser.add_argument('author', type=str, required=True, help='Author is required')
        parser.add_argument('image', type=str, required=True, help='Image filename is required')
        parser.add_argument('genre', type=str, required=True, help='Genre is required')
        parser.add_argument('price', type=int, required=True, help='Price is required')
        args = parser.parse_args()

        error_messages = []

        # Check if a book with the given name already exists
        existing_book = Book.query.filter_by(name=args['name']).first()
        if existing_book:
            error_messages.append('A book of this name already exists.')

        # Validate book name
        if not all(char.isalnum() or char.isspace() or char in ['-', ':', '!'] for char in args['name']):
            error_messages.append('A book name can only contain alphanumeric characters, and/or the symbols -, : and !.')

        # Validate author name
        if not all(char.isalpha() or char.isspace() for char in args['author']):
            error_messages.append('An author name can only contain letters of the alphabet.')

        # Validate image filename
        if not args['image'].endswith(('.png', '.jpg', '.jpeg')):
            error_messages.append('The only accepted image file formats are .png, .jpg, and .jpeg.')
        
        # Check if the genre exists
        genre = Genre.query.filter_by(name=args['genre']).first()
        if not genre:
            error_messages.append('No such genre was found.')

        # Check if price is positive
        if args['price'] <= 0:
            error_messages.append('Price must be a positive integer.')

        # Return any error messages
        if error_messages:
            return {'errors': error_messages}, 400

        # If no errors, add the new book to the database
        new_book = Book(
            name=args['name'],
            author=args['author'],
            genre=genre.name,
            image=args['image'],
            price=args['price']
        )

        db.session.add(new_book)
        # Increase book count of that genre
        genre.count+=1
        db.session.commit()

        return make_response(jsonify({'message': 'Book added successfully.'}), 201)

    # Update book information by book ID
    @auth_required("token")
    @roles_required('Librarian')
    def put(self, book_id):

        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str)
        parser.add_argument('author', type=str)
        parser.add_argument('genre', type=str)
        parser.add_argument('image', type=str)
        parser.add_argument('price', type=int)
        args = parser.parse_args()

        error_messages = []

        ## Ensure that the book exists
        book = Book.query.get(book_id)
        if not book:
            abort(404, message='Book not found')

        ## Validate new book name, if given 
        if args['name']:
            existing_book = Book.query.filter_by(name=args['name']).first()
            if existing_book:
                error_messages.append('A book of this name already exists.')
            elif not all(char.isalnum() or char.isspace() or char in ['-', ':', '!'] for char in args['name']):
                error_messages.append('A book name can only contain alphanumeric characters, and/or the symbols -, : and !.')

        ## Validate new author name, if given
        if args['author']:
            if not all(char.isalpha() or char.isspace() for char in args['author']):
                error_messages.append('An author name can only contain letters of the alphabet.')

        ## Validate new genre, if given
        if args['genre']:
            genre = Genre.query.filter_by(name=args['genre']).first()
            if not genre:
                error_messages.append('No such genre was found.')
            elif not args['genre'].replace(' ', '').isalpha():
                error_messages.append('Genre name can only contain letters and spaces.')
        
        ## Validate new image filename, if given
        if args['image']:
            if not args['image'].endswith(('.png', '.jpg', '.jpeg')):
                error_messages.append('The only accepted image file formats are .png, .jpg, and .jpeg.')

        ## Validate new price, if given
        if args['price']:
            if args['price'] <= 0:
                error_messages.append('Price must be a positive integer.')
        
        ## Return error messages, if any
        if error_messages:
            return make_response(jsonify({'errors': error_messages}), 400)
        
        # If no errors, update book details
        if args['name']:
            book.name = args['name']

        if args['author']:
            book.author = args['author']

        if args['genre']:
            old_genre = Genre.query.filter_by(name=book.genre).first()
            new_genre = Genre.query.filter_by(name=args['genre']).first()

            old_genre.count-=1
            new_genre.count+=1
            book.genre = args['genre']

        if args['image']:
            book.image = args['image']

        if args['price']:
            book.price = args['price']

        db.session.commit()

        return make_response(jsonify({'message': 'Book details modified successfully.'}), 201)

    # Delete book by book ID
    @auth_required("token")
    @roles_required('Librarian')
    def delete(self, book_id):

        book = Book.query.get(book_id)
        if book:

            genre = Genre.query.filter_by(name=book.genre).first()
            requests = Request.query.filter_by(book_id=book.id).all()
            purchases = Purchase.query.filter_by(book_id=book.id).all()

            genre.count-=1

            # Delete all requests for that book
            for request in requests:
                db.session.delete(request)

            # Delete all purchases of that book
            for purchase in purchases:
                db.session.delete(purchase)
            
            # Finally, delete the book
            db.session.delete(book)
            db.session.commit()

            return make_response(jsonify({'message': 'Book deleted successfully'}), 201)
        else:
            abort(404, message='Book not found')

api.add_resource(BookResource, '/books', '/books/<int:book_id>', '/books/<string:genre_name>')

genre_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'count': fields.Integer
}

class GenreResource(Resource):
    @marshal_with(genre_fields)
    @auth_required("token")
    @cache.memoize(60)
    def get(self, genre_id=None):
        
        # Retrieving a particular genre for modification or deletion
        if genre_id:
            genre = Genre.query.get(genre_id)
            if not genre:
                abort(404, message='Genre not found')
            return genre
        
        # Retrieving all genres for display to librarian & students
        else:
            genres = Genre.query.all()
            if not genres:
                abort(404, message='No genres found')
            return genres

    # Add a genre
    @auth_required("token")
    @roles_required('Librarian')
    def post(self):

        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True, help='Genre is required')
        args = parser.parse_args()

        # Check if the genre name already exists
        existing_genre = Genre.query.filter_by(name=args['name']).first()
        if existing_genre:
            return make_response(jsonify({'message': 'Genre already exists.'}), 400)

        # Check if the genre name contains only letters and spaces
        if not args['name'].replace(' ', '').isalpha():
            return make_response(jsonify({'message': 'Genre name can only contain letters and spaces.'}), 400)

        # Add the new genre
        new_genre = Genre(name=args['name'], count=0)
        db.session.add(new_genre)
        db.session.commit()

        return make_response(jsonify({'message': 'Genre added successfully.'}), 201)

    # Update a genre
    @auth_required("token")
    @roles_required('Librarian')
    def put(self, genre_id):
        genre = Genre.query.get(genre_id)
        if not genre:
            abort(404, message='Genre not found')

        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True, help='Genre is required')
        args = parser.parse_args()

        # Check if the genre name already exists
        existing_genre = Genre.query.filter_by(name=args['name']).first()
        if existing_genre:
            return make_response(jsonify({'error': 'That genre already exists.'}), 400)

        # Validate genre name
        if not args['name'].replace(' ', '').isalpha():
            return make_response(jsonify({'error': 'Genre name can only contain letters and spaces.'}), 400)

        # If no issues, update genre
        books = Book.query.filter_by(genre=genre.name).all()
        for book in books:
            book.genre = args['name']

        genre.name = args['name']
        db.session.commit()

        return make_response(jsonify({'message': 'Genre modified successfully.'}), 201)

    # Delete a genre
    @auth_required("token")
    @roles_required('Librarian')
    def delete(self, genre_id):

        genre = Genre.query.get(genre_id)
        if not genre:
            abort(404, message='Genre not found')

        # Retrieve all books of that genre
        books = Book.query.filter_by(genre=genre.name).all()
        for book in books:
            requests = Request.query.filter_by(book_id=book.id).all()
            purchases = Purchase.query.filter_by(book_id=book.id).all()

            # Delete all requests for each book of that genre
            for request in requests:
                db.session.delete(request)

            # Delete all purchases for each book of that genre
            for purchase in purchases:
                db.session.delete(purchase)
                
            db.session.delete(book)
        
        # Finally, delete the genre
        db.session.delete(genre)
        db.session.commit()

        return make_response(jsonify({'message': 'Genre deleted successfully'}))

api.add_resource(GenreResource, '/genres', '/genres/<int:genre_id>')


class RequestResource(Resource):
    @auth_required("token")
    @cache.cached(60)
    def get(self):

        # Retrieve a list of all requests
        requests = Request.query.all()
        if not requests:
            return make_response(jsonify({'message': 'No requests found'}), 400)
        
        # Send in the following format
        formatted_requests = []
        for request in requests:
            book = Book.query.get(request.book_id)
            user = User.query.get(request.user_id)
            formatted_requests.append({
                'request_id': request.id,
                'book_name': book.name,
                'user_name': user.username,
                'timestamp': request.timestamp,
                'status': request.status,
                'last_status_update': request.last_status_update
            })
        return jsonify(formatted_requests)

    # Create a new request
    @auth_required("token")
    def post(self):

        parser = reqparse.RequestParser()
        parser.add_argument('book_id', type=int, required=True, help='Book ID is required')
        parser.add_argument('user_id', type=int, required=True, help='User ID is required')
        args = parser.parse_args()

        # Ensure that the book and user exist
        book = Book.query.get(args['book_id'])
        if not book:
            return make_response(jsonify({'error': 'No such book found.'}), 400)
        user = User.query.get(args['user_id'])
        if not user:
            return make_response(jsonify({'error': 'No such user found.'}), 400)
        
        # Create a request
        new_request = Request(
            book_id=args['book_id'],
            user_id=args['user_id'],
            timestamp=datetime.now(),
            status='Pending',
            last_status_update=datetime.now()
        )

        # Add the new request to the database
        db.session.add(new_request)
        # Increase no. of pending requests for that book
        book.pending_count+=1
        db.session.commit()

        return make_response(jsonify({'message': 'Request made successfully.'}), 201)

    # Update the status of a request
    @auth_required("token")
    @roles_required('Librarian')
    def put(self, request_id):
        
        parser = reqparse.RequestParser()
        parser.add_argument('status', type=str, required=True, help='Status info is required')
        args = parser.parse_args()

        # Retrieve the request of given id
        request_obj = Request.query.filter_by(id=request_id).first()

        if not request_obj:
            abort(404, message='Request not found')

        # Update the status of the request
        request_obj.status = args['status']

        book = Book.query.get(request_obj.book_id)

        # Request is no longer pending, so decrease count
        book.pending_count-=1
        if args['status'] == 'Approved':
            # Increase accessed_count if request is approved
            book.accessed_count+=1

        db.session.commit()

        # Notify the user through email about the status of their request
        user = User.query.get(request_obj.user_id)
        send_message(user.email, "Request " + request_obj.status, "Your access request for " + book.name + " has been " + request_obj.status.lower() + ".")

        return make_response(jsonify({'message': 'Status updated'}), 201)

api.add_resource(RequestResource, '/requests', '/requests/<int:request_id>')


class PurchaseResource(Resource):
    @auth_required("token")
    @cache.cached(60)
    def get(self):

        # Retrieve a list of all purchases
        purchases = Purchase.query.all()
        if not purchases:
            abort(404, message='No purchases found')
        formatted_purchases = []

        # Send in the following format
        for purchase in purchases:
            book = Book.query.get(purchase.book_id)
            user = User.query.get(purchase.buyer_id)
            formatted_purchases.append({
                'purchase_id': purchase.id,
                'book_name': book.name,
                'user_name': user.username,
                'timestamp': purchase.timestamp,
                'amount': purchase.amount
            })
        return make_response(jsonify(formatted_purchases))

    # Add a new transaction
    @auth_required("token")
    def post(self):
    
        parser = reqparse.RequestParser()
        parser.add_argument('book_id', type=int, required=True, help='Book ID is required')
        parser.add_argument('buyer_id', type=int, required=True, help='Buyer ID is required')
        parser.add_argument('amount', type=int, required=True, help='Amount is required')
        args = parser.parse_args()

        # Ensure that the book and user exist
        book = Book.query.get(args['book_id'])
        if not book:
            return make_response(jsonify({'error': 'No such book found.'}), 400)
        user = User.query.get(args['buyer_id'])
        if not user:
            return make_response(jsonify({'error': 'No such user found.'}), 400)

        # Create a transaction
        new_purchase = Purchase(
            book_id=args['book_id'],
            buyer_id=args['buyer_id'],
            timestamp=datetime.now(),
            amount=args['amount']
        )

        # Add the new transaction to the database
        db.session.add(new_purchase)
        # Increase bought_count of that particular book
        book.bought_count+=1
        db.session.commit()

        return make_response(jsonify({'message': 'Purchase made successfully.'}), 201)
    
api.add_resource(PurchaseResource, '/purchases', '/purchases/<int:user_id>')

##############################################################################################


################################# Celery Tasks ###############################################

# Send a daily reminder to log in
@celery_app.task(ignore_result=True)
def daily_reminder():

    # Retrieve all students
    users = User.query.filter(User.roles.any(Role.name == "Student")).all()
    today = date.today()
    for user in users:
        # Ignore newly signed-up users
        if user.last_login_date is not None:
            date_diff = today - user.last_login_date
            # Check if it's been more than a day since the last login
            if date_diff.days > 1:
                send_message(user.email, "The Library Awaits!", "Visit Us Today!")

# Run a check to see if the week of book access is over
@celery_app.task(ignore_result=True)
def book_return():
    # Only check approved requests, obviously
    requests = Request.query.filter_by(status='Approved').all()
    now = datetime.now()
    for request in requests:
        # Calculate how long it's been since the request was approved
        time_diff = now - request.last_status_update
        # Convert the difference into hours
        borrow_hours = (time_diff.days * 24) + (time_diff.seconds // 3600)
        # 7 days = 168 hours
        if borrow_hours >= 168:
            # Update request status
            request.status = 'Returned'

            book = Book.query.get(request.book_id)
            # Decrease book's accessed_count
            book.accessed_count-=1

            db.session.commit()

            # Notify the user through email that their book has been returned
            user = User.query.get(request.user_id)
            send_message(user.email, "Book Returned", 
                        "The borrowing period for your accessed book " + book.name + " has concluded.")

# Send the user some stats from the past month
@celery_app.task(ignore_result=True)
def monthly_stats():
    # Retrieve all students
    users = User.query.filter(User.roles.any(Role.name == "Student")).all()
    # Get the previous month by getting today's date, setting the date to the first of the month, going a day back, and then retrieving the month 
    previous_month = (date.today().replace(day=1) - date.timedelta(days=1)).month
    for user in users:
        req_no = 0
        buy_no = 0
        amt = 0

        user_requests = Request.query.filter_by(user_id=user.id).all()
        user_purchases = Purchase.query.filter_by(buyer_id=user.id).all()

        for user_request in user_requests:
            # Check which requests were made in the last month
            if user_request.timestamp.month == previous_month:
                # Increment the number of requests
                req_no+=1
                
        for user_purchase in user_purchases:
            # Check which purchases were made in the last month
            if user_purchase.timestamp.month == previous_month:
                # Increment the number of requests, and add to the total money spent on books
                buy_no+=1
                amt+=user_purchase.amount
        
        # Send statistics to the user
        send_message(user.email, "Your Monthly Statistics", 
                    "You made " + req_no + " book access requests, and " + buy_no + " purchases, spending a total of Rs." + amt + ".")

# Just a test for email demonstration
@celery_app.task(ignore_result=True)
def email_test():
    send_message("librarian@gmail.com", "Test Subject", "Test Content")

# Add all periodic tasks to the scheduler
@celery_app.on_after_configure.connect
def tasks_schedule(sender, **kwargs):

    # Access time checks and book returns happen every 4 hours
    sender.add_periodic_task(crontab(minute=0, hour='*/4'), book_return.s())

    # Daily reminder is sent at 5:30 PM every evening
    sender.add_periodic_task(crontab(minute=30, hour=17), daily_reminder.s())

    # Monthly stats are sent on the first day of each month
    sender.add_periodic_task(crontab(0, 0, day_of_month='1'), monthly_stats.s())

##############################################################################################


############################ Miscellaneous Functions #########################################

@app.route('/')
def index():
    return render_template("index.html")

# Perform signup validation
@app.post('/signup')
def signup():
    # Get user input
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    error_messages = []

    # Validate username
    if not username.isalnum():
        error_messages.append('Username must only contain alphanumeric characters.')
    # Check that it isn't already being used    
    else:
        user = User.query.filter_by(username=username).first()
        if user:
            error_messages.append('That username is already in use. Please choose another.')

    # Validate email address
    if not email.endswith("@gmail.com") or not email.replace('.', '').replace('@', '').isalnum():
        error_messages.append('Email address must end in @gmail.com, and contain only alphanumeric characters otherwise.')
    # Check that it isn't already being used
    else:
        user = User.query.filter_by(email=email).first()
        if user:
            error_messages.append('An account linked to this email already exists.')

    # Validate password
    if not all(char.isalnum() or char in ('!', '_', '?', '#', '&') for char in password):
        error_messages.append('Invalid password. Use only alphanumeric characters and/or special symbols !, _, ?, #, and &.')
    # Password and confirm_password must be the same
    elif password != confirm_password:
        error_messages.append('Password and Confirm Password do not match.')

    # Return any errors
    if error_messages:
        return {'error_messages': error_messages}, 400


    # If no issues, create the user
    datastore.create_user(username=username, roles=["Student"], email=email, password=generate_password_hash(password))
    db.session.commit()

    return {'message': 'User registered successfully'}, 201

# Log the user in
@app.post('/log_in')
def log_in():
    # Get user input
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    # Check that user email and password match
    if user and check_password_hash(user.password, password):
        login_user(user)
        # Set the last_login_date
        user.last_login_date = date.today()
        db.session.commit()

        return jsonify({'token': user.get_auth_token(), 'role': user.roles[0].name}), 200
    else:
        return make_response(jsonify({'error_message': 'Invalid credentials.'}), 404)

# Log out the user
@app.post('/log_out')
@auth_required("token")
def log_out():
    try:
        # Clear the cache
        cache.clear()
        logout_user()
        return make_response(jsonify({'message': 'Logout successful'}), 200) 
    except Exception as e:
        return {'error_message': str(e)}, 500

# Get details of the currently logged-in user
@app.route('/get_user', endpoint='get_user')
@auth_required("token")
def get_user():
    if current_user:
        user_details = {
            'id': current_user.id,
            'username': current_user.username
        }
        return make_response(jsonify(user_details))
    else:
        abort(404, message='No user logged in')

# Check whether a book has been requested/accessed/purchased by the current user, using the book's ID
@app.route('/book_checks/<int:bookId>', endpoint='book_checks')
@auth_required("token")
def book_checks(bookId):
    user_id = current_user.id
    requested = False
    purchased = False

    # Check if the user has already requested access, or has been given access, to this book
    request_pending = Request.query.filter_by(user_id=user_id, book_id=bookId, status='Pending').first()
    request_approved = Request.query.filter_by(user_id=user_id, book_id=bookId, status='Approved').first()
    if request_pending or request_approved:
        requested = True

    # Check if the user has already purchased this book
    purchase = Purchase.query.filter_by(buyer_id=user_id, book_id=bookId).first()
    if purchase:
        purchased = True

    # Send both flags
    return make_response(jsonify({
        'requested': requested,
        'purchased': purchased
    }))

##############################################################################################


if __name__ == "__main__":
    app.run(debug=True)