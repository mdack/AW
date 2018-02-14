"use strict";
const express = require("express");
const path = require("path");
const config = require("./config");
const router_user = require("./Negocio/Usuario/sa_users");
const router_questions = require("./Negocio/Preguntas/sa_questions");

let app = express();
app.use("/user", router_user); 
app.use("/questions", router_questions);

const ficherosEstaticos = path.join(__dirname, "public");
app.use(express.static(ficherosEstaticos));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", function(request, response){
    response.status(200);
    response.redirect("login.html");
});

app.get("/login.html", function(request, response){
    response.status(200);
    response.render("login", {errorMsg: null, errores: []});
});

app.get("/newUser.html", function(request, response){
    response.status(200);
    response.render("newUser", {errores: [], msg: null});
});

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.")
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});