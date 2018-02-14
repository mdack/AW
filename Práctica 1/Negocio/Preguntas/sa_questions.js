"use strict";
const express = require("express");
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const mysql = require("mysql");
const path = require("path");
const fs = require('fs');
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const config = require("../../config");
const utils = require("./questions_utils");
const daoQuestions = require("../../Integracion/Preguntas/dao_questions");

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
});

let daoQ = new daoQuestions.DAOQuestions(pool);

const miRouter = express.Router();

const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password,
    database: config.mysqlConfig.database
});

const middlewareSession = session({
    saveUninitialized: false,
    secret: "mySecretSession",
    resave: false,
    store: sessionStore
});

miRouter.use(middlewareSession);
miRouter.use(expressValidator());

const ficherosEstaticos = path.join(__dirname, "../../public");
miRouter.use(express.static(ficherosEstaticos));
miRouter.use(bodyParser.urlencoded({ extended: false }));

miRouter.use(expressValidator({
    customValidators: { dosOpciones: param => {
       let lineas = param.split('\n');
       if(lineas.length >= 2){
           return true;
       }else{
           return false;
       }
    }
    }
}));

/**
 * Middleware para saber si se ha identificado un usuario correctamente.
 */
function isLogin(request, response, next){
    if(request.session.currentUser){
        response.locals.userId = request.session.currentUser;
        response.locals.points = request.session.pointsUser;
        next();
    }else{
        response.redirect("login.html");
    }
}

function selectedQuestion(request, response, next){
    if(request.session.currentQuestId){
        response.locals.questionId = request.session.currentQuestId;
        response.locals.questEnun = request.session.currentQuestEnun;
        next();
    }else{
        response.redirect("questions.html");
    }
}


miRouter.get("/addQuestion.html", isLogin, function(request, response){
    response.status(200);
    response.render("addQuestion", {errores: [], msg: null});
});

miRouter.get("/questions.html", isLogin, function(request, response){

    daoQ.randomQuestions((err, q) => {
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.render("questions", {questions: q});
        }
    });

});

miRouter.post("/addQuestion", isLogin, function(request, response){
    request.checkBody("lEnunciado", "Enunciado vacío").notEmpty();
    request.checkBody("opciones", "Sin respuestas").notEmpty();
    request.checkBody("opciones", "Al menos 2 opciones").dosOpciones();

    request.getValidationResult().then(result => {
        if(result.isEmpty()){
            let text = request.body.opciones;
            let enun = request.body.lEnunciado;

            let op = utils.getAnswers(text);

            daoQ.addQuestion(response.locals.userId, enun, op, err => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                }else{
                    response.status(200);
                    response.render("addQuestion",{errores: [], msg: "Tu pregunta ha sido creada correctamente"});
                }
            });
        }else{
            response.status(200);
            response.render("addQuestion", {errores : result.mapped(), msg: null});
        }
    });
});

miRouter.get("/selectQuestion/:id", function(request, response){
    let id = request.params.id;
    daoQ.getEnunQuestion(id,function(err, result){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            request.session.currentQuestId = id;
            request.session.currentQuestEnun = result.question;
            response.redirect("../answer_question.html");
        }
    });

});

miRouter.get("/answer_question.html", isLogin, selectedQuestion, function(request, response){
    daoQ.isAnswered(response.locals.questionId, response.locals.userId, function(err, answered){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.render("answer_question", {answered: answered});
        }
    });
});

miRouter.post("/answerQuestion",isLogin, selectedQuestion, function(request, response){
    request.checkBody("answer", "Prueba").isAlphanumeric();

    request.getValidationResult().then(result => {
        if(result.isEmpty()){
            let idA = request.body.answer;
            if(idA !== "otra"){
                daoQ.answerOwnQuestion(response.locals.userId, idA, err => {
                    if(err){
                        response.status(500);
                        response.render("error_500", {mensaje: err.message, pila: err.stack});
                    }else{
                        response.status(200);
                        response.redirect("questions.html");
                    }
                });
            } else{
                let text = request.body.other_answer;
                daoQ.insertOtherAnswer(response.locals.questionId, text, (err, newId) => {
                    daoQ.answerOwnQuestion(response.locals.userId, newId, err => {
                        if(err){
                            response.status(500);
                            response.render("error_500", {mensaje: err.message, pila: err.stack});
                        }else{
                            response.status(200);
                            response.redirect("questions.html");
                        }
                    });
                });
            }     
        }else{
            daoQ.getQuestion(response.locals.questionId, function(err, res){
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                }else{
                    response.status(200);
                    response.render("question", {questions: res, msg: "Por favor, seleccione una opción"});
                }
            });
        }
    });
});

miRouter.get("/question.html", isLogin, selectedQuestion, function(request, response){
    daoQ.getQuestion(response.locals.questionId, function(err, res){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.render("question", {questions: res, msg: null});
        }
    });
});

module.exports = miRouter; 