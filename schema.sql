DROP DATABASE IF EXISTS bonnaroo_db;

CREATE DATABASE bonnaroo_db;

USE bonnaroo_db;

CREATE TABLE bands (
    band_id INTEGER AUTO_INCREMENT NOT NULL,
    band_name VARCHAR(30) NOT NULL,
    genre VARCHAR(30),
    stage VARCHAR(30) NOT NULL,
    on_day VARCHAR(10) NOT NULL,
    start_time TIME,
    end_time TIME,
    PRIMARY KEY(band_id)
);

INSERT INTO bands(band_name, genre, stage, on_day, start_time, end_time)
VALUES ("Chase Atlantic", "Alternative", "This Tent", "Thursday", "21:00", "22:00"),
("Durand Jones & The Indications", "R&B", "That Tent", "Thursday", "21:45", "22:45"),
("CloZee", "Electronic", "The Other", "Thursday", "21:00", "22:00"),
("Spafford", "Jam", "This Tent", "Thursday", "22:45", "23:45"),
("Elohim", "Electronic", "This Tent", "Thursday", "00:30", "01:30"),
("R.LUM.R", "R&B", "That Tent", "Thursday", "23:30", "00:30"),
("Pigeons Playing Ping Pong", "Jam", "That Tent", "Thursday", "01:00", "02:30"),
("Manic Focus", "Electronic", "The Other", "Thursday", "22:15", "23:15"),
("Space Jesus", "Electronic", "The Other", "Thursday", "23:30", "00:30"),
("Valentino Khan", "Electronic", "The Other", "Thursday", "00:45", "01:45"),
("Opiuo", "Electronic", "The Other", "Thursday", "02:00", "03:00");

SELECT 
    band_name, 
    genre, 
    stage, 
    on_day, 
    TIME_FORMAT(start_time, '%h:%i %p') start_time,
    TIME_FORMAT(end_time, '%h:%i %p') end_time
FROM bands;

CREATE TABLE fans (
    fan_id INTEGER NOT NULL AUTO_INCREMENT,
    username VARCHAR(30) NOT NULL,
    user_pass VARCHAR(30) NOT NULL,
    PRIMARY KEY(fan_id)
);

INSERT INTO fans (username, user_pass)
VALUES ("admin", "password");