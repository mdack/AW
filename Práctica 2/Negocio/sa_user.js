"use strict";
const express = require("express");
const path = require("path");
const fs = require('fs');
const bodyParser = require("body-parser");
const passport = require("passport");
const mysql = require("mysql");
const config = require("../config");
const daoUsers = require("../Integracion/dao_user");

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
}); 

let daoU = new daoUsers.DAOUsers(pool);

const miRouter = express.Router();

miRouter.get("/games", passport.authenticate('basic', {session: false}), (request, response) => {
    let login = request.query.idU;
    daoU.getGames(login, function(err, result){
        if(err){
            response.status(500);
            response.json(err);
        }else{
            response.status(200);
            response.json({result: result});
        }
    });
});

module.exports = miRouter; 