
const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./config/database');
const Employee = require('./models/employee');
const Movie = require('./models/movie');
const app = express();
const port = process.env.PORT || 8000;


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.engine('hbs', engine({
  extname: '.hbs',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true
  }
}));
app.set('view engine', 'hbs');


// Connect to MongoDB Atlas
mongoose.connect(database.url)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- Employee Routes --------------------

// Get all employees
app.get('/api/employees', (req, res) => {
  Employee.find()
    .then((employees) => res.json(employees))
    .catch((err) => res.status(500).send(err));
});

// Get an employee by ID
app.get('/api/employees/:employee_id', (req, res) => {
  Employee.findById(req.params.employee_id)
    .then((employee) => {
      if (!employee) return res.status(404).json({ error: "Employee not found" });
      res.json(employee);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Create a new employee
app.post('/api/employees', (req, res) => {
  Employee.create({
    name: req.body.name,
    salary: req.body.salary,
    age: req.body.age
  })
    .then(() => Employee.find())
    .then(employees => res.json(employees))
    .catch(err => res.status(500).send(err));
});

// Update an employee
app.put('/api/employees/:id', (req, res) => {
  Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then(updatedEmployee => {
      if (!updatedEmployee) return res.status(404).send({ message: 'Employee not found' });
      res.status(200).send(updatedEmployee);
    })
    .catch(err => res.status(500).send(err));
});

// Delete an employee
app.delete('/api/employees/:id', (req, res) => {
  Employee.findByIdAndDelete(req.params.id)
    .then(deletedEmployee => {
      if (!deletedEmployee) return res.status(404).send({ message: 'Employee not found' });
      res.status(200).send({ message: 'Employee deleted successfully' });
    })
    .catch(err => res.status(500).send(err));
});

// -------------------- Movie Routes --------------------


// Home page - display all movies
app.get('/', async (req, res) => {
  try {
    // Fetch all movies and sort by Movie_ID in ascending order
    const movies = await Movie.find().sort({ Movie_ID: 1 });
    res.render('index', { movies });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ Movie_ID: 1 }); // Sorted by Movie_ID
    res.json(movies);
  } catch (err) {
    res.status(500).send(err);
  }
});


// Show specific movie by Movie_ID and Movie Title
app.get('/movie/:id', async (req, res) => {
  try {
    const movie = await Movie.findOne({ Movie_ID: req.params.id });
    if (!movie) return res.status(404).send('Movie not found');
    res.render('show', { movie });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
      const id = req.params.id;
      const isNumeric = !isNaN(id);  // Check if the ID is a number (Movie_ID)
      
      // Construct query object based on the type of ID
      const query = isNumeric ? { Movie_ID: parseInt(id) } : { Title: new RegExp(id, 'i') }; // Case-insensitive search by Title

      const movie = await Movie.findOne(query);
      
      if (!movie) {
          return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
  } catch (err) {
      res.status(500).json({ message: "Error retrieving movie", error: err.message });
  }
});



app.get('/add', (req, res) => {
  res.render('add');
})
app.post('/api/movies', async (req, res) => {
  try {
    const { Movie_ID, Title, Released, Genre, Director, Plot } = req.body;
    
    const newMovie = new Movie({
      Movie_ID,
      Title,
      Released,
      Genre: Genre || [],
      Director,
      Plot,
      Image: null // Set Image as null if not provided
    });

    await newMovie.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).json({ message: "Error inserting movie data", error: err.message });
  }
});


// Route to display the Update Movie form
app.get('/edit/:id', async (req, res) => {
  try {
    const movie = await Movie.findOne({ Movie_ID: req.params.id });
    if (!movie) return res.status(404).send('Movie not found');
    res.render('update', { movie });
  } catch (err) {
    res.status(500).send(err);
  }
});
// Route to handle updating a movie (only Title and Released)
app.post('/api/movies/update/:id', async (req, res) => {
  const { Title, Released } = req.body; // Only accept Title and Released

  try {
    // Update only the Title and Released fields
    const updatedMovie = await Movie.findOneAndUpdate(
      { Movie_ID: req.params.id },
      { Title, Released },
      { new: true }  // Return the updated document
    );

    if (!updatedMovie) {
      return res.status(404).send('Movie not found');
    }

    // Redirect to the updated movie's detail page
    res.redirect(`/movie/${updatedMovie.Movie_ID}`);
  } catch (err) {
    res.status(500).send('Error updating movie: ' + err.message);
  }
});
//update movie
app.put('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate(
      { Movie_ID: req.params.id },  // Use Movie_ID instead of _id
      { $set: { Title: req.body.Title, Released: req.body.Released } },
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: "Error updating movie", error: err.message });
  }
});



// Delete a movie by Movie_ID

app.post('/delete/:id', async (req, res) => {
  try {
    await Movie.deleteOne({ Movie_ID: req.params.id });
    res.redirect('/');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/api/movies/:id', async (req, res) => {
  try {
    // Attempt to find and delete the movie by Movie_ID
    const movie = await Movie.findOneAndDelete({ Movie_ID: req.params.id });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting movie", error: err.message });
  }
});



// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
