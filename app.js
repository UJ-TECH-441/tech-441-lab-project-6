// Import required packages
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const hbs = require('hbs');
require('dotenv').config({ path: ['.env.local', '.env'] });

// Create Express instance
const app = express();

// Set port number (change if there is a conflicting service running on 3000)
const port = process.env.PORT || 3000;
app.set('port', port);

// Set up Express to handle JSON, URL encoding, POST bodies and static files
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// Configure views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Register all files in the /routes directory as Express routes
const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(route => require(path.join(routesDir, route))(app));

// Create HTTP server and plug it with the Express instance
const server = http.createServer(app);

// Start server
server.listen(port);
server.on('listening', () => console.log(`Listening on port ${server.address().port}`));
