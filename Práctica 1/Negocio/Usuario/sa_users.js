"use strict";
const express = require("express");
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const mysql = require("mysql");
const path = require("path");
const fs = require('fs');
const bodyParser = require("body-parser");
const multer = require("multer");
const expressValidator = require("express-validator");
const utils = require("./user_utils");
const config = require("../../config");
const daoUsers = require("../../Integracion/Usuario/dao_users");

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
});

let daoU = new daoUsers.DAOUsers(pool);

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

miRouter.use(expressValidator());

const ficherosEstaticos = path.join(__dirname, "../../public");
let multerFactory = multer({ storage: multer.memoryStorage()});
miRouter.use(express.static(ficherosEstaticos));


/**
 * Middleware para saber si se ha identificado un usuario correctamente.
 */
function isLogin(request, response, next){
    if(request.session.currentUser){
        response.locals.userId = request.session.currentUser;
        response.locals.points = request.session.pointsUser;
        next();
    }else{
        response.redirect("../login.html");
    }
}

/**
 * Middleware para recoger solicitudes de amistad
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
function requestList(request, response, next){
    
    daoU.findMyRequests(response.locals.userId, (err, result) => {
            
        if(!err){
            request.listRequest = result;
            next();
        }else{
            console.log(err);
        }
    });
}

miRouter.use(bodyParser.urlencoded({ extended: false }));
miRouter.use(middlewareSession);

/**
 * Crear un nuevo usuario
 */
miRouter.post("/addUser", multerFactory.single("lProfP"), function(request, response, next){
    
    request.checkBody("lEmail", "Email vacío").isEmail();
    request.checkBody("lPassword", "La contraseña no es válida").isLength({ min: 6, max: 30 });
    request.checkBody("lName", "Nombre de usuario vacío").notEmpty();
    request.checkBody("sexo", "Elige un género").notEmpty();
    
    request.getValidationResult().then(result => {
        if(result.isEmpty()){

            daoU.findByEmailAndName(request.body.lEmail, request.body.lName, 0, (err, exists) => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                }else{
                    if(exists){
                        response.render("newUser", {msg: "Ya existe otro usaurio con ese email y nombre", errores: []});
                    }
                    else{
                        let foto = null;
                        if (request.file) {
                            foto = request.file.buffer;
                        }
                        let user = { email : request.body.lEmail,
                            password : request.body.lPassword,
                            name : request.body.lName,
                            gender : request.body.sexo,
                            dob : request.body.lDate,
                            img : foto};
            
            
                        daoU.insertUser(user,(err, newId) => {
                            response.status(200);
                            if(!err){
                                request.session.currentUser = newId;
                                request.session.pointsUser = 0;
                                response.redirect("profile.html");
                            }else{
                                response.render("newUser", {msg: "Error al registrar usuario", errores: []});
                            }
                        });
                    }
                }
            });
          
        }else{
            response.status(200);
            response.render("newUser", {errores: result.mapped(), msg: null});
        }
    });

   
});

/**
 * Entrar en la aplicación
 */
miRouter.get("/login", function(request, response){
    request.checkBody("lEmail", "Email vacío").notEmpty();
    request.checkBody("lPassword", "Contraseña vacía").notEmpty();
    let email = request.body.lEmail;
    let password = request.body.lPassword;

    request.getValidationResult().then(result => {
        if(result.isEmpty()){
            daoU.isUserCorrect(email, password, (err, result) => {
                if (err) {
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                } else if (result) {
                    response.status(200);
                    request.session.currentUser = result.id;
                    request.session.pointsUser = result.puntos;
                    response.redirect("profile.html");
                } else {
                    response.status(200);
                    request.session.destroy();
                    response.render("login", {errorMsg: "Dirección de correo y/o contraseña no válidos.", errores: []});
                }
            });
        }else{
            response.status(200);
            response.render("login", {errores: result.mapped(), errorMsg: null});
        }
    });


});

/**
 * Recibe el usuario modificado
 */
miRouter.post("/modifyUser", isLogin,  multerFactory.single("lProfP"), function(request, response){
    request.checkBody("lEmail", "Email vacío").notEmpty();
    request.checkBody("lPassword", "Contraseña vacía").notEmpty();
    request.checkBody("lPassword", "La contraseña no es válida").isLength({ min: 6, max: 30 });
    request.checkBody("lName", "Nombre vacío").notEmpty();
    request.checkBody("sexo", "Elige un género").notEmpty();
    request.checkBody("modify_img", "Elige una opción").notEmpty();

    request.getValidationResult().then(result => {
        if(result.isEmpty()){
            daoU.findByEmailAndName(request.body.lEmail, request.body.lName, response.locals.userId, (err, exists) => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                }else{
                    response.status(200);
                    let change_img = false;
                    let foto = null;
                    let user = { id: response.locals.userId,
                        email : request.body.lEmail,
                        password : request.body.lPassword,
                        name : request.body.lName,
                        gender : request.body.sexo,
                        dob : request.body.lDate,
                        img : foto,
                        change : change_img };
                    if(exists){
                        response.render("modifyUser", {usuario: user, msg: "Ya existe otro usaurio con ese email y nombre", errores : []});
                    }else{
                        if(request.body.modify_img === "si"){
                            change_img = true;
                            if (request.file) {
                                foto = request.file.buffer;
                            }
                        }   
                        user.img = foto;
                        user.change = change_img;         
                        daoU.modifyUser(user, (err) => {
                        if(!err){
                            response.render("modifyUser", {usuario: user, msg: "Usuario modificado correctamente", errores : []});
                        }else{
                            response.render("modifyUser", {usuario: user, msg: "Problemas al intentar modificar usuario", errores : []});
                        }
                        });
                    }
                }
            });
         
        }
        else {
            daoU.findById( response.locals.userId, (err, r) => {
                if (err) {
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                } else if (r !== undefined) {
                    response.status(200);
                    let date = utils.parseDOB(r.dob);
                    let usu = {id: r.id, 
                                email: r.email, 
                                password: r.password,
                                name: r.name,
                                gender: r.gender,
                                dob: date};
                    response.render("modifyUser", {usuario: usu, msg: "", errores : result.mapped()});
                } else {
                    response.status(200);
                    request.session.destroy();
                    response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo", errores: []});
                }
            });
        }
    });
});

/**
 * Para buscar los amigos que le interesan
 */
miRouter.get("/findFriend", isLogin, function(request, response){
    let nombre = request.query.fName;

    daoU.findFriendsByName(response.locals.userId, function(err, result){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            let list = utils.findUsersByName(nombre, result);
            response.render("find_friends", {cadena: nombre, busqueda : list});
        }
    });
});


/**
 * Muestra página de amigos
 */
miRouter.get("/friends.html", isLogin, requestList,function(request, response, next){
    response.status(200);
    let friends = [];
    let sol = [];

    daoU.findMyFriends(response.locals.userId, (err, f) => {
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.render("friends", {solicitudes: request.listRequest, friends: f});
        }
    });

});

/**
 * Muestra datos para modificar usuario
 */
miRouter.get("/modifyUser.html", isLogin, function(request, response){
    daoU.findById( response.locals.userId, (err, result) => {
        if (err) {
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        } else if (result !== undefined) {
            response.status(200);
            let date = utils.parseDOB(result.dob);
            let usu = {id: result.id, 
                        email: result.email, 
                        password: result.password,
                        name: result.name,
                        gender: result.gender,
                        dob: date };
            response.render("modifyUser", {usuario: usu, msg: null, errores: []});
        } else {
            response.status(200);
            request.session.destroy();
            response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo", errores: []});
        }
    });
});

miRouter.get("/uploadPicture.html", isLogin, function(request, response){
    daoU.findById(response.locals.userId, (err, result) => {
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        } else if (result != undefined){
            response.status(200);
            let date = utils.parseDOB(result.dob);
            let usu = {id: result.id, 
                        email: result.email, 
                        password: result.password,
                        name: result.name,
                        gender: result.gender,
                        dob: date };
            response.render("uploadPicture", {usuario: usu, msg: null, errores: []});
        } else{
            response.status(200);
            request.session.destroy();
            response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo", errores: []});
        }
    });
});

miRouter.post("/uploadPicture", isLogin,  multerFactory.single("lPicture"), function(request, response){
    request.checkBody("descr", "Es necesaria una descipción").notEmpty();
    request.checkBody("lPicture", "Selecciona una foto").notEmpty();

    request.getValidationResult().then(result => {
        if(!result.isEmpty()){
            daoU.findById( response.locals.userId, (err, r) => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: err.message, pila: err.stack});
                }else{
                        let foto = null;
                        if (request.file) {
                            foto = request.file.buffer;
                        }
                        let data = { id : response.locals.userId,
                            descr : request.body.descr,
                            img : foto};
                        if((data.img!=null)&&(data.descr!=null)){
                            daoU.insertPhoto(data,(err, r) => {
                            if(!err){
                                daoU.reducePoints(response.locals.points, response.locals.userId, (err, r) => {
                                    if(!err){
                                        response.status(200);
                                        response.render("uploadPicture", {msg: "¡Foto subida correctamente!", errores: []}); 
                                    }
                                    else{
                                        response.render("uploadPicture", {msg: "No se han podido actualizar los puntos.", errores: []});
                                    }
                                });
                                
                            }else{
                                response.render("uploadPicture", {msg: "Error al subir la foto", errores: []});
                            }
                        });
                        }else{
                            response.render("uploadPicture", {msg: "Error al subir la foto. Faltan campos por rellenar.", errores: []});
                        }
                }
            });
        }else{
            response.render("uploadPicture", {errores: result.mapped(), msg: "Error al subir la foto"});
        }
    });
});


/**
 * Muestra el perfil de otro usuario
 */
miRouter.post("/profile_friend", isLogin, function(request, response){
    let id = request.body.id_friend;
    daoU.findById(id, (err, result) => {
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else if(result){
            response.status(200);
            let edad = utils.calulateAge(result.dob);
            let usu = {id: result.id, nombre: result.name, edad: edad, sexo: result.gender , puntos: result.puntos};
            response.render("profile_friend", {usuario: usu});
        }else {
            response.status(200);
            response.redirect("profile.html");
        }
    });
});

/**
 * Muestra perfil usuario
 */
miRouter.get("/profile.html", isLogin, function(request, response){
    daoU.findById( response.locals.userId, (err, result) => {
        if (err) {
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        } else if (result !== undefined) {
            response.status(200);
            let edad = utils.calulateAge(result.dob);
            let usu = {id: result.id, nombre: result.name, edad: edad, sexo: result.gender , puntos: result.puntos};
            response.render("profile", {usuario: usu});
        } else {
            response.status(200);
            request.session.destroy();
            response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo"});
        }
    });
});

/**
 * Obtiene imagen de perfil del usuario identificado.
 */
miRouter.get("/imagen/:userId", (request, response) => {

    let n = Number(request.params.userId);

    if (isNaN(n)) {
        response.status(400);
        response.end("Petición incorrecta");
    } else {
        daoU.getUserImage(n, (err, imagen) => {
            if (imagen) {
                response.status(200);
                response.end(imagen);
            } else {
                let urlFichero = path.join("public/img/", "NoProfile.png");
                fs.readFile(urlFichero, function(err, contenido) {
                    if (err) {
                        console.log(err);
                    } else {
                        response.status(200);
                        response.end(contenido);
                    }
                });
            }
        });
    }
});

/**
 * Envia petición de amistad a un usuario si es que no es su
 * amigo o si la solicitud no ha sido enviada aún.
 */
miRouter.get("/addFriend/:id", isLogin, function(request, response){
    let id = request.params.id;
    
    daoU.addFriend(response.locals.userId, id, (err) => {
            if(err){
                response.status(500);
                response.render("error_500", {mensaje: err.message, pila: err.stack});
            }else{
                response.status(200);
                response.redirect("../friends.html");
            }
    });
    
});

miRouter.get("/acceptFriend/:id", isLogin, function(request, response){
    let id = request.params.id;
    let idU = response.locals.userId;

    daoU.answerRequest(idU, id, 1, function(err){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.redirect("../friends.html");
        }
    });
});

miRouter.get("/refuseFriend/:id", isLogin, function(request, response){
    let id = request.params.id;
    let idU = response.locals.userId;

    daoU.answerRequest(idU, id, 2, function(err){
        if(err){
            response.status(500);
            response.render("error_500", {mensaje: err.message, pila: err.stack});
        }else{
            response.status(200);
            response.redirect("../friends.html");
        }
    });
});

miRouter.get("/logout", function(request, response){
    response.status(200);
    request.session.destroy();
    response.redirect("/");
});

miRouter.get("/userPhotos.html", isLogin, function(request, response){
     daoU.findById(response.locals.userId, (err, result) => {
        if(err){
            console.error(err);
        } else if (result != undefined){
            daoU.findMyPhotos(response.locals.userId, (err, f) => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: error.message, pila: error.stack});
                }else{
                    response.status(200);
                    response.render("photos", {photos: f});
                }
            });
        } else{
            response.status(200);
            request.session.destroy();
            response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo"});
        }
    });
});

miRouter.post("/friendPhotos", isLogin, function(request, response){
    let id = Number(request.body.id_friend);
    daoU.findById(id, (err, result) => {
        if(err){
            console.error(err);
        } else if (result != undefined){
            daoU.findMyPhotos(id, (err, f) => {
                if(err){
                    response.status(500);
                    response.render("error_500", {mensaje: error.message, pila: error.stack});
                }else{
                    response.status(200);
                    response.render("friendPhotos", {photos: f, nombre: request.body.name});
                }
            });
        } else{
            response.status(200);
            request.session.destroy();
            response.render("login", {errorMsg: "Problemas de acceso, vuelva a intentarlo"});
        }
    });
});

miRouter.get("/photo/:photoId", (request, response) => {

    let n = Number(request.params.photoId);

    if (isNaN(n)) {
        response.status(400);
        response.end("Petición incorrecta");
    } else {
        daoU.getPhoto(n, (err, imagen) => {
            if (imagen) {
                response.status(200);
                response.end(imagen);
            } else {
                let urlFichero = path.join("public/img/", "NoPhoto.png");
                fs.readFile(urlFichero, function(err, contenido) {
                    if (err) {
                        console.log(err);
                    } else {
                        response.status(200);
                        response.end(contenido);
                    }
                });
            }
        });
    }
});


module.exports = miRouter; 