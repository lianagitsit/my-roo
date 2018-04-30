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
            // if(err) throw err;
            // console.log(res);
            if (res[0].user_pass === inquirerResponse.password){
                console.log("Welcome to My Roo!");
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
            "Search by Stage"
        ]
    }).then(inquirerResponse => {
        switch(inquirerResponse.action){
            case "See Bands by Day":
                searchByDay();
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
                
                var table = new Table({
                    head: ['Band', 'Genre', 'Stage', 'Start', 'End'], 
                    colWidths: [40, 20, 15, 10, 10]
                });

                for (let i = 0; i < res.length; i++){
                    table.push([res[i].band_name, res[i].genre, res[i].stage, res[i].start_time, res[i].end_time]);
                };

                console.log(table.toString());
            })
     })
 }