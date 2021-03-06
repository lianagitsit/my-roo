/* 
    TODOs: 
    * Refactor to DRY this out, yowza
    * Manager view to add bands from CLI
    * Feature to check whether shows conflict with user's schedule
*/

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
    userLoginOrRegister();
})

function userLoginOrRegister() {
    inquirer.prompt({
        name: "confirm",
        type: "confirm",
        message: "Already have an account?",
        default: true
    }).then(inquirerResponse => {
        if (inquirerResponse.confirm) {
            login();
        }
        // TODO: Add user registration
    })
}

function login() {
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
        connection.query("SELECT * FROM fans WHERE username=?", [inquirerResponse.username], (err, res) => {
            if (res[0].user_pass === inquirerResponse.password) {
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
            "Browse by Day",
            "Browse by Genre",
            "Browse by Stage",
            "Search for a Band",
            "See Bands I've Rated",
            "Logout"
        ]
    }).then(inquirerResponse => {
        switch (inquirerResponse.action) {
            case "Browse by Day":
                searchByDay();
                break;
            case "Browse by Genre":
                searchByGenre();
                break;
            case "Browse by Stage":
                searchByStage();
                break;
            case "Search for a Band":
                searchByBand();
                break;
            case "See Bands I've Rated":
                viewMyBands();
                break;
            // TODO: View My Schedule option
            case "Logout":
                connection.end();
                break;
        }
    })
}

function searchByDay() {
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

            for (let i = 0; i < res.length; i++) {
                table.push([res[i].band_name, res[i].genre, res[i].stage, res[i].start_time, res[i].end_time]);
                bandsArray.push(res[i].band_name);
            };

            console.log(table.toString());
            checkoutBand(bandsArray);
        })
    })
}

function searchByGenre() {
    connection.query("SELECT DISTINCT genre FROM bands", (err, res) => {
        const genres = [];

        for (let i = 0; i < res.length; i++) {
            genres.push(res[i].genre);
        }

        inquirer.prompt({
            type: "list",
            message: "Select a genre:",
            name: "genre",
            choices: genres
        }).then(genreResponse => {
            connection.query("SELECT band_name, genre, stage, on_day, TIME_FORMAT(start_time, '%h:%i %p') start_time, TIME_FORMAT(end_time, '%h:%i %p') end_time FROM bands WHERE genre=?", [genreResponse.genre], (err, resGenre) => {

                var bandsArray = [];

                var table = new Table({
                    head: ['Band', 'Genre', 'Stage', 'Day', 'Start', 'End'],
                    colWidths: [40, 15, 15, 15, 10, 10]
                });

                for (let i = 0; i < resGenre.length; i++) {
                    table.push([resGenre[i].band_name, resGenre[i].genre, resGenre[i].stage, resGenre[i].on_day, resGenre[i].start_time, resGenre[i].end_time]);
                    bandsArray.push(resGenre[i].band_name);
                };

                console.log(table.toString());
                checkoutBand(bandsArray);
            })
        })
    })
}

function searchByStage() {
    connection.query("SELECT DISTINCT stage FROM bands", (err, res) => {
        const stages = [];
        for (let i = 0; i < res.length; i++) {
            stages.push(res[i].stage);
        }

        inquirer.prompt({
            type: "list",
            message: "Select a stage:",
            name: "stage",
            choices: stages
        }).then(stageResponse => {
            connection.query("SELECT band_name, genre, stage, on_day, TIME_FORMAT(start_time, '%h:%i %p') start_time, TIME_FORMAT(end_time, '%h:%i %p') end_time FROM bands WHERE stage=?", [stageResponse.stage], (err, resStage) => {

                var bandsArray = [];

                var table = new Table({
                    head: ['Band', 'Genre', 'Stage', 'Day', 'Start', 'End'],
                    colWidths: [40, 15, 15, 15, 10, 10]
                });

                for (let i = 0; i < resStage.length; i++) {
                    table.push([resStage[i].band_name, resStage[i].genre, resStage[i].stage, resStage[i].on_day, resStage[i].start_time, resStage[i].end_time]);
                    bandsArray.push(resStage[i].band_name);
                };

                console.log(table.toString());
                checkoutBand(bandsArray);
            })
        })
    })
}

function searchByBand() {
    inquirer.prompt({
        type: "input",
        message: "Enter the band you're looking for:",
        name: "bandName"
    }).then(bandSearchRes => {
        connection.query("SELECT band_name, genre, stage, on_day, TIME_FORMAT(start_time, '%h:%i %p') start_time, TIME_FORMAT(end_time, '%h:%i %p') end_time FROM bands WHERE band_name=?", [bandSearchRes.bandName], (err, resBand) => {
            if (resBand.length === 0){
                console.log("That band doesn't seem to be playing this year!");
                return setTimeout(searchByBand, 1000);
            }
            var bandsArray = [];

            var table = new Table({
                head: ['Band', 'Genre', 'Stage', 'Day', 'Start', 'End'],
                colWidths: [40, 15, 15, 15, 10, 10]
            });

            for (let i = 0; i < resBand.length; i++) {
                table.push([resBand[i].band_name, resBand[i].genre, resBand[i].stage, resBand[i].on_day, resBand[i].start_time, resBand[i].end_time]);
                bandsArray.push(resBand[i].band_name);
            };

            console.log(table.toString());
            checkoutBand(bandsArray);
        })
    })
}

function viewMyBands(){
    connection.query("SELECT band_name, rating, on_schedule FROM fan_ratings WHERE fan_id=? ORDER BY rating DESC", [currentUserID], (err, res) => {
        var bandsArray = [];

        var table = new Table({
            head: ['Band', 'Rating', 'See?'],
            colWidths: [40, 10, 10]
        });

        for (let i = 0; i < res.length; i++) {
            table.push([res[i].band_name, res[i].rating, res[i].on_schedule]);
            bandsArray.push(res[i].band_name);
        };

        console.log(table.toString());
        start();
    })
}

function checkoutBand(arr) {
    inquirer.prompt([
        {
            type: "list",
            name: "band",
            message: "Select the band you want to check out:",
            choices: arr
        }
    ]).then(checkoutBandResponse => {
        var band = checkoutBandResponse.band;

        connection.query("SELECT * FROM fan_ratings WHERE fan_id=? AND band_name=?", [currentUserID, band], (err, res) => {

            // If the fan has not rated this band yet, prompt for rating and schedule.
            if (res.length === 0) {
                inquirer.prompt([
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
                    }
                ]).then(ratingAndScheduleResponse => {
                    var newRating = ratingAndScheduleResponse.rating;
                    var onSchedule = ratingAndScheduleResponse.onSchedule;

                    connection.query("INSERT INTO fan_ratings(fan_id, band_name, rating, on_schedule) VALUES(?, ?, ?, ?); ", [currentUserID, band, newRating, onSchedule], (err, insertBandResponse) => {
                        console.log("Added " + band + " to your fan list!");

                        // After making changes to the database, prompt to checkout another band
                        inquirer.prompt({
                            type: "confirm",
                            name: "addAnotherBand",
                            message: "Do you want to checkout another band playing on this day?",
                            default: true
                        }).then(anotherBandResponse => {
                            // If they want to checkout another band, display the list again; otherwise, return to main options
                            if (anotherBandResponse.addAnotherBand) {
                                checkoutBand(arr);
                            } else {
                                start();
                            }
                        })
                    })

                })

            } else {
                // If the fan has already rated this band, prompt to change their rating
                var recordedRating = res[0].rating;
                var isOnSchedule = res[0].on_schedule;

                console.log("\nYou've already rated " + band + " a " + recordedRating + ".");

                inquirer.prompt({
                    type: "confirm",
                    name: "confirmRatingChange",
                    message: "Do you want to change your rating?",
                    default: true
                }).then(confirmResponse => {
                    if (confirmResponse.confirmRatingChange) {
                        inquirer.prompt({
                            type: "input",
                            name: "rating",
                            message: "How much do you like this band? \n1) I'd rather stare at a tapestry for an hour \n2) I'm fine if the tapestry is playing this music \n3) I'll go if my friends are going\n4) Definitely 'planning' on it\n5) If I miss this I'll die\n"
                        }).then(changeRatingResponse => {
                            var newRating = changeRatingResponse.rating;

                            connection.query("UPDATE fan_ratings SET rating=? WHERE fan_id=? AND band_name=?", [newRating, currentUserID, band], (err, updateRatingRes) => {
                                console.log("Your rating for " + band + " has been updated to a " + newRating);

                                // If their rating has gone up and the band is not on their schedule, let them add it
                                if (newRating > recordedRating && !isOnSchedule) {
                                    inquirer.prompt({
                                        type: "confirm",
                                        name: "addToSchedule",
                                        message: "You like " + band + " more than you used to! Do you want to add them to your schedule?",
                                        default: true
                                    }).then(scheduleResponse => {
                                        if (scheduleResponse.addToSchedule) {
                                            connection.query("UPDATE fan_ratings SET on_schedule=1 WHERE fan_id=? AND band_name=?", [currentUserID, band], (err, updateScheduleRes) => {
                                                console.log(band + " has been added to your schedule!");

                                                // After making changes to the database, prompt to checkout another band
                                                inquirer.prompt({
                                                    type: "confirm",
                                                    name: "addAnotherBand",
                                                    message: "Do you want to checkout another band playing on this day?",
                                                    default: true
                                                }).then(anotherBandResponse => {
                                                    // If they want to checkout another band, display the list again; otherwise, return to main options
                                                    if (anotherBandResponse.addAnotherBand) {
                                                        checkoutBand(arr);
                                                    } else {
                                                        start();
                                                    }
                                                })
                                            })
                                        }
                                    })

                                    // If their rating has gone down and the band is on their schedule, let them remove it
                                } else if (newRating < recordedRating && isOnSchedule) {
                                    inquirer.prompt({
                                        type: "confirm",
                                        name: "removeFromSchedule",
                                        message: "You like " + band + " less than you used to! Do you want to remove them from your schedule?",
                                        default: true
                                    }).then(scheduleResponse => {
                                        if (scheduleResponse.removeFromSchedule) {
                                            connection.query("UPDATE fan_ratings SET on_schedule=0 WHERE fan_id=? AND band_name=?", [currentUserID, band], (err, updateScheduleRes) => {
                                                console.log(band + " has been removed from your schedule!");

                                                // After making changes to the database, prompt to checkout another band
                                                inquirer.prompt({
                                                    type: "confirm",
                                                    name: "addAnotherBand",
                                                    message: "Do you want to checkout another band playing on this day?",
                                                    default: true
                                                }).then(anotherBandResponse => {
                                                    // If they want to checkout another band, display the list again; otherwise, return to main options
                                                    if (anotherBandResponse.addAnotherBand) {
                                                        checkoutBand(arr);
                                                    } else {
                                                        start();
                                                    }
                                                })
                                            })
                                        }
                                    })
                                }
                            })
                        })
                    }
                })
            }
        })
    })
}