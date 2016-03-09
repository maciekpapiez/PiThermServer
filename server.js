// server.js - NodeJS server for the PiThermServer project.

/* 

Parses data from DS18B20 temperature sensor and serves as a JSON object.
Uses node-static module to serve a plot of current temperature (uses highcharts).

Tom Holderness 03/01/2013
Ref: www.cl.cam.ac.uk/freshers/raspberrypi/tutorials/temperature/
*/

// Load node modules
var fs = require('fs');
var sys = require('sys');
var http = require('http');
var sqlite3 = require('sqlite3');

// Use node-static module to server chart for client-side dynamic graph
var nodestatic = require('node-static');

// Setup static server for current directory
var staticServer = new nodestatic.Server(".");

// Setup database connection for logging
var db = new sqlite3.Database('./piTemps.db');

var mapping = ['28-0415932916ff', '28-041593349dff', '28-04159338d0ff', '28-0415933d94ff', '28-0415937f5cff'];

// Write a single temperature record in JSON format to database table.
function insertTemp(data){
   // data is a javascript object   
   var statement = db.prepare("INSERT INTO temperature_records VALUES (?, ?, ?)");
   // Insert values into prepared statement
   statement.run(data.timestamp, data.temperature, data.sensor_id);
   // Execute the statement
   statement.finalize();
}

function readAllTemperatures(callback) {
   mapping.forEach(function(sensor_id) {
      readTemp(sensor_id, function(data) {
         console.log('Sensor ' + data.sensor_id + ' returned ' + data.temperature + ' on ' + data.timestamp);
      });
   });
}

// Read current temperature from sensor
function readTemp(sensor_id, callback){
   fs.readFile('/sys/bus/w1/devices/' + sensor_id + '/w1_slave', function(err, buffer)
	{
      if (err){
         console.error(err);
         process.exit(1);
      }

      // Read data from file (using fast node ASCII encoding).
      var data = buffer.toString('ascii').split(" "); // Split by space

      // Extract temperature from string and divide by 1000 to give celsius
      var temp = parseFloat(data[data.length-1].split("=")[1])/1000.0;

      // Round to on decimal place
      temp = Math.round(temp * 10) / 10;

      // Add date/time to temperature
   	var data = {
            timestamp: Date.now(),
            temperature: temp,
            sensor_id: sensor_id
            };

      // Execute call back with data
      callback(data);
   });
};

// Create a wrapper function which we'll use specifically for logging
function scheduleLogging(interval){
   setInterval(readAllTemperatures, interval, insertTemp);
};

// Start temperature logging (every 5 min).
var msecs = 10 * 1000; // log interval duration in milliseconds
scheduleLogging(msecs);

console.log('Server is logging to database at '+msecs+'ms intervals');
