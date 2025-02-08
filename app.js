const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware to parse request body data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');  // Use EJS as the template engine

// Database connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // Ensure this is correct; usually empty in XAMPP
    database: 'weather_app'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL Database");
    }
});

// Function to get weather data from OpenWeatherMap API
async function getWeatherData(city) {
    try {
        const apiKey = '0d3e7c2f75454795c7f66c7bad89f48b';
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        const data = response.data;
        return {
            city: data.name,
            temperature: data.main.temp,
            description: data.weather[0].description,
            condition: data.weather[0].main.toLowerCase()  // Capture weather condition (rain, sun, etc.)
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

// Weather Description to CSS Class Mapping
function getWeatherClass(description) {
    switch(description.toLowerCase()) {
        case 'clear sky':
        case 'sunny':
            return 'sunny'; // Light Yellow
        case 'overcast clouds':
        case 'broken clouds':
        case 'scattered clouds':
            return 'cloudy'; // Light Gray
        case 'haze':
            return 'haze'; // Light Beige
        default:
            return 'default'; // Default background
    }
}

// Route to display the homepage and fetch weather data from MySQL
app.get('/', (req, res) => {
    const query = 'SELECT * FROM weather_data';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data from database:', err);
            res.send('Error fetching data');
        } else {
            res.render('index', { data: results, getWeatherClass });
        }
    });
});

// Route to handle form submission
app.post('/add_weather', async (req, res) => {
    const city = req.body.city;

    // Fetch weather data from OpenWeatherMap API
    const weatherData = await getWeatherData(city);
    if (!weatherData) {
        res.send("Error: Could not retrieve weather data.");
        return;
    }

    // Save the weather data to the MySQL database
    const query = 'INSERT INTO weather_data (city, temperature, description) VALUES (?, ?, ?)';
    db.query(query, [weatherData.city, weatherData.temperature, weatherData.description], (err) => {
        if (err) {
            console.error('Error inserting data into database:', err);
            res.send('Error saving data');
        } else {
            res.redirect('/');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
