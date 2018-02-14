"use strict";
const express = require("express");
const path = require("path");
const fs = require('fs');
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const passport = require("passport");
const mysql = require("mysql");
const config = require("../config");
const daoUsers = require("../Integracion/dao_user");
const daoGames = require("../Integracion/dao_games");
const daoHistory = require("../Integracion/dao_historial");
const utils = require("./utils_games");

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
}); 

let daoU = new daoUsers.DAOUsers(pool);
let daoG = new daoGames.DAOGames(pool);
let daoH = new daoHistory.DAOHistory(pool);

const miRouter = express.Router();
miRouter.use(expressValidator());

miRouter.use(bodyParser.json());
miRouter.use(bodyParser.urlencoded({ extended: false }));

miRouter.get("/status", passport.authenticate('basic', {session: false}), function(request, response){
    let idP = request.query.id;
    
    daoG.existsGame(idP, function(err, exists){
        if(exists){
            daoG.statusGame(idP, function(err, status){
                if(err){
                    response.status(500);
                    response.json(err);
                }else{
                    response.status(200);
                    response.json(JSON.parse(status));
                }
            });
        }else{
            response.status(404);
        }
    });
});

miRouter.put("/newGame", passport.authenticate('basic', {session: false}), function(request, response){
    let name, id;

    name = request.body.game;
    id = request.body.idU;

    daoG.insertGame(name, id, function(err, result){
        if(err){
            response.status(500);
        }else{
            response.json({result: result});
            response.status(201);
            
        }
        response.end();
    });
});

miRouter.put("/newPlayer", passport.authenticate('basic', {session: false}), function(request, response){
    let idP = request.body.idPartida; 
    let idU = request.body.idUsuario;

    daoG.existsGame(idP, function(err, exists){
        if(exists){
            daoG.getPlayers(idP, function(err, result){
                if(err){
                    response.status(500);
                }else{
                    var players = result;
                    let event = "";
                    /*
                    var pertenece = false;
                    players.forEach(element => {
                        console.log(element);
                        if(element.login === request.body.log) pertenece = true;
                    });*/
                    if((players.length < 4)){
                        let login = request.body.log;
                        if(players.map(n => n.login).indexOf(login, 0) === -1){
                            daoG.insertPlayer(idP, idU, function(err, result){
                                if(err){
                                    response.status(500);
                                }else{
                                    event = "El jugador " + login + " se ha unido a la partida.";
                                    addHistory(event, idP);
                                    players.push({login: login});
                                    response.status(200);
                                    if(players.length === 4){  
                                        event = "Empieza la partida.";
                                        addHistory(event, idP);
                                        let d = [];
                                        let info = utils.iniGame(players, d);

                                        d.forEach(element => {
                                            let e = "El jugador " + element.p + " ha descartado 4 con valor " + element.v;
                                            addHistory(e, idP);
                                        });

                                        daoG.insertStatus(idP, info, function(err){
                                            if(err){
                                                response.status(500);
                                                response.end();
                                            }
                                            else{
                                                response.status(200);
                                                response.json({name: result});
                                            }
                                        });
                                    }
                                    else{
                                    //console.log("El jugador se une a la partida '"+ result +"'. Los jugadores que pertenecen a esa partida son: ");
                                    response.json({ name: result,
                                                    playerList: players});

                                    response.end();
                                    }
                                }
                            });
                        }else{
                            response.status(200);
                            response.end();
                        }
                    }else{
                        response.status(400);
                        response.end();
                    }
                }
            });
        }else{
            response.status(404);
            response.end();
        }
    });   
   
});

miRouter.get("/update", passport.authenticate('basic',{session: false}), function(request, response){
    let idP = request.query.id;

    daoG.getPlayers(idP, function(err, players){
        if(err){
            response.status(500);
            response.json(err);
        }else{
            response.status(200);
            response.json({players: players});
        }
    });
});

miRouter.post("/action", passport.authenticate('basic',{session: false}), function(request, response){
    let idP = request.body.id;

    daoG.existsGame(idP, function(err, exists){
        if(err){
            response.status(500);
            response.json(err);
        }else{
            if(exists){
                daoG.statusGame(idP, function(err, status){
                    if(err){
                        response.status(500);
                        response.json(err);
                    }else{
                        let event = "";
                        let buttonPlay = request.body.button;
                        let s = JSON.parse(status);
                        let player = request.body.user;
                        let msg = "Has puesto tus cartas sobre la mesa correctamente";
                        response.status(200);

                        if(s.winner !== ""){
                            response.json("La partida está finalizada. El ganador ha sido " + s.winner);
                        }else{

                            if(buttonPlay){//Va a añadir cartas
                                if(!s.valueCards){//Si no hay un valor en la mesa porque es la primera jugada
                                    s.valueCards = request.body.value;
                                }
                                let cards = request.body.playCards;

                                s.lastMove.player = player;
                                s.lastMove.move = cards;
                                
                                //Actualizamos las cartas del usuario
                                let userCards = utils.getCardsPlayer(s.playerCards, player);

                                utils.quitCards(userCards, cards);

                                s.playerCards.forEach(element => {
                                    if(element.player === player)
                                        element.cards = userCards;
                                });

                                utils.addCards(s.playedCards, cards);

                                //Actualizamos el turno
                                let pos = (s.turns.indexOf(player, 0) + 1);

                                if(pos === 4){
                                    pos = 0;
                                }
                                s.actTurn = s.turns[pos];

                                if(userCards.length === 0){
                                    s.winner = player;
                                    msg = "Enhorabuena! Has ganado la partida!!";
                                    event = player + " ha ganado la partida!";
                                    addHistory(event);
                                }

                                daoG.insertStatus(idP, JSON.stringify(s), function(err){
                                    if(err){
                                        response.status(500);
                                    }else{
                                        event = player + " ha añadido " + cards.length + " cartas con valor " + s.valueCards + ".";
                                        addHistory(event, idP);
                                        response.json(msg);
                                    }
                                });
                            }else{//Dice que el jugador anterior es un mentiroso
                                if(s.lastMove.player === ""){
                                    response.json("Eres el primero te toca jugar");
                                }else{
                                    if(s.lastMove.move.length === 0){
                                        response.json("Eres el primero te toca jugar");
                                    }else{
                                        let iguales = true;

                                        for(let i = 0; i < s.lastMove.move.length; i++){
                                            if(s.lastMove.move[i].cara != s.valueCards){
                                                iguales = false;
                                                i = s.lastMove.move.length;
                                            }
                                        }

                                        let list = [];
                                        if(iguales){
                                                list = utils.getCardsPlayer(s.playerCards, player);
                                                msg = "Eres un incrédulo...";
                                                event = player + " no se ha creido a " + s.lastMove.player + " y se lleva todas las cartas.";
                                                addHistory(event, idP);
                                        }else{
                                                list = utils.getCardsPlayer(s.playerCards, s.lastMove.player);
                                                msg = "Has encontrado al mentiroso!";
                                                event = s.lastMove.player + " ha sido descubierto por " +  player  + " y se lleva todas las cartas.";
                                                addHistory(event, idP);
                                        }
                                        utils.addCards(list, s.playedCards);
                                        let d = [];
                                        if(iguales){
                                            utils.quitRepeatCards(list, d, player);
                                            s.playerCards.forEach(element => {
                                                if(element.player === player)
                                                    element.cards = list;
                                            });
                                        }else{
                                            utils.quitRepeatCards(list, d, s.lastMove.player);
                                            s.playerCards.forEach(element => {
                                                if(element.player === s.lastMove.player)
                                                    element.cards = list;
                                            });
                                        }

                                        d.forEach(element => {
                                            let e = "El jugador " + element.p + " ha descartado 4 con valor " + element.v;
                                            addHistory(e, idP);
                                        });


                                        s.lastMove.player = player;
                                        s.lastMove.move = [];
                                        s.playedCards = [];
                                        s.valueCards = null;

                                        //Actualizamos el turno
                                        let pos = (s.turns.indexOf(player, 0) + 1);

                                        if(pos === 4){
                                            pos = 0;
                                        }
                                        s.actTurn = s.turns[pos];

                                        daoG.insertStatus(idP, JSON.stringify(s), function(err){
                                            if(err){
                                                response.status(500);
                                            }else{
                                                response.json(msg);
                                            }
                                        });
                                        
                                    }
                                }
                            }
                        }
                    }
                });
            }else{
                response.status(404);
                response.end();
            }
        }
    });
});

miRouter.get("/history", passport.authenticate('basic',{session: false}), function(request, response){
    let idP = request.query.id;

    daoH.getHistory(idP, function(err, result){
        if(err){
            response.status(500);
            response.end();
        }else{
            response.status(200);
            response.json({history: result});
        }
    });
});

function addHistory(event, id){
    daoH.insertEvent(id, event, function(err){
        if(err){
            console.log(err);
        }
    });
}

module.exports = miRouter; 