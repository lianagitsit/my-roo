require("dotenv").config();
var sql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table2');

var connection = sql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "bonnaroo_db"
 });

 var currentUserID;

 connection.connect(err => {
    //  if (err) throw err;
     userLoginOrRegister();
 })

 function userLoginOrRegister(){
     inquirer.prompt({
         name: "confirm",
         type: "confirm",
         message: "Already have an account?",
         default: true
     }).then(inquirerResponse => {
         if (inquirerResponse.confirm){
             login();
         }
     })
 }

 function login(){
     inquirer.prompt([
         {
            name: "username",
            type: "input",
            message: "Enter username:"
        },
        {
            name: "password",
            type: "list",
            message: "Password:",
            choices: [
                "password",
                "pass123",
                "Pa$$word"
            ]
        }
    ]).then(inquirerResponse => {
        connection.query("SELECT * FROM fans WHERE username=?", [inquirerResponse.username], (err, res) =>{
            if (res[0].user_pass === inquirerResponse.password){
                currentUserID = res[0].id;
                console.log("Welcome to My Roo! Your user ID is:", currentUserID);
                start();
            } else {
                console.log("Incorrect password! Try again.");
                login();
            }
        })
    })
 }

 function start() {
     inquirer.prompt({
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
            "See Bands by Day",
            "See Bands by Genre",
            "See Bands I've Rated",
            "Search by Stage",
            "Search for a Band",
            "Logout"
        ]
    }).then(inquirerResponse => {
        switch(inquirerResponse.action){
            case "See Bands by Day":
                searchByDay();
                break;
            case "Logout":
                connection.end();
                break;
        }
    })
 }

 function searchByDay(){
     inquirer.prompt({
         type: "list",
         name: "day",
         message: "Which day's schedule would you like to see?",
         choices: ["Thursday", "Friday", "Saturday", "Sunday"]
     }).then(inquirerResponse => {
            connection.query("SELECT band_name, genre, stage, TIME_FORMAT(start_time, '%h:%i %p') start_time, TIME_FORMAT(end_time, '%h:%i %p') end_time FROM bands WHERE on_day=?", [inquirerResponse.day], (err, res) => {
                var bandsArray = [];

                var table = new Table({
                    head: ['Band', 'Genre', 'Stage', 'Start', 'End'], 
                    colWidths: [40, 20, 15, 10, 10]
                });

                for (let i = 0; i < res.length; i++){
                    table.push([res[i].band_name, res[i].genre, res[i].stage, res[i].start_time, res[i].end_time]);
                    bandsArray.push(res[i].band_name);
                };

                console.log(table.toString());
                checkoutBand(bandsArray);
            })
     })
 }

 function checkoutBand(arr){
     inquirer.prompt([
         {
            type: "list",
            name: "band",
            message: "Select the band you want to check out:",
            choices: arr
        },
        {
            type: "input",
            name: "rating",
            message: "How much do you like this band? \n1) I'd rather stare at a tapestry for an hour \n2) I'm fine if the tapestry is playing this music \n3) I'll go if my friends are going\n4) Definitely 'planning' on it\n5) If I miss this I'll die\n"
        },
        {
            type: "confirm",
            name: "onSchedule",
            message: "Do you want to add this band to your schedule?",
            default: true
        },
        {
            type: "confirm",
            name: "addBand",
            message: "Do you want to checkout another band on this day?",
            default: true
        }
     ]).then(inquirerResponse => {

        connection.query("INSERT INTO fan_ratings(fan_id, band_name, rating, on_schedule) VALUES(?, ?, ?, ?); ", [currentUserID, inquirerResponse.band, inquirerResponse.rating, inquirerResponse.onSchedule], (err, res) => {
            console.log("Added " + inquirerResponse.band + " to your fan list!");
            
            if (inquirerResponse.addBand){
                checkoutBand(arr);
            } else {
                start();
            }
        })
     })
 }