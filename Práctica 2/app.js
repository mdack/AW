"use strict";
const express = require("express");
const path = require("path");
const https = require("https");
const fs = require("fs");
const mysql = require("mysql");
const passport = require("passport");
const passportHTTP = require("passport-http");
const expressValidator = require("express-validator");
const bodyParser = require("body-parser");
const config = require("./config");
const router_user = require("./Negocio/sa_user");
const router_games = require("./Negocio/sa_games");
const daoUsers = require("./Integracion/dao_user");
const daoGames = require("./Integracion/dao_games");

let app = express();

const ficherosEstaticos = path.join(__dirname, "public");
app.use(express.static(ficherosEstaticos));

const clavePrivada = fs.readFileSync(path.join(__dirname, "mi_clave.pem"));
const certificado = fs.readFileSync(path.join(__dirname, "certificado_firmado.crt"));

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
}); 

let daoU = new daoUsers.DAOUsers(pool);
let daoG = new daoGames.DAOGames(pool);

/**
 * Middleware para añadir los daos al atributo request
 */
app.use(function addDaos(request, response, next){
    request.daoU = daoU;
    request.daoG = daoG;
    next();
});

app.use("/user", router_user);
app.use("/games", router_games);

app.use(passport.initialize());
passport.use(new passportHTTP.BasicStrategy(({ realm: "Atenticacion requerida" },
    function(login, pwd, callback) {
        daoU.findUser(login, pwd, (err, isCorrect) => {
            if (!err) {
                if (isCorrect) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            }
        });
})));

app.use(expressValidator());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/login", function(request, response){
    request.checkBody("login", "Email vacío").notEmpty();
    request.checkBody("pwd", "Contraseña vacía").notEmpty();
    let user = request.body.login;
    let pwd = request.body.pwd;

    request.getValidationResult().then(result => {
        if(result.isEmpty()){
            daoU.findUser(user, pwd, function(err, isCorrect, idU){
                        if(err){
                            response.status(500);
                            response.json({msg: err});
                        }else{
                            response.status(200);
                            if(isCorrect)
                                response.json({correct: true, id: idU});
                            else
                                response.json({correct: false});
                        }
            });
        }
        else{
            response.status(400);
            response.json({errors : result.mapped()});
        }
    });

});

app.put("/newUser", function(request, response){
    request.checkBody("login", "Usuario no valido").notEmpty();
    request.checkBody("pwd", "Contraseña no valida").notEmpty();
    request.checkBody("pwd", "La contraseña no es válida").isLength({ min: 6, max: 30 });
    let user = request.body.login;
    let pwd = request.body.pwd;

    request.getValidationResult().then(result => {
        if (result.isEmpty()) {
            daoU.findByLogin(user, function(err, exists){
                if(err){
                    response.status(500);
                    response.json(err);
                }else{
                    if(exists){
                        response.status(400);
                        response.json({msg : "El usuario ya existe."});
                    }else{
                        request.daoU.insertUser(user, pwd, function(err, idU){
                            if(err){
                                response.status(500);
                                response.json(err);
                            }else{
                                response.status(201);
                                response.json({id: idU});
                            }
                        });
                    }
                }
            });
        }else{
            response.status(400);
            response.json({errors : result.mapped()});
        }
    });

});

let servidor = https.createServer({ key: clavePrivada, cert: certificado }, app);

servidor.listen(config.port, (err) => {
    console.log("Escuchando en puerto 5555");
});