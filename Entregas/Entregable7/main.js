const express = require("express");
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const mysql = require("mysql");
const path = require("path");
const bodyParser = require("body-parser");
const config = require("./config");
const daoTasks = require("./dao_tasks");
const daoUsers = require("./dao_users");
const taskUtils = require("./task_utils");

const app = express();

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
});

const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "tareas"
});

const middlewareSession = session({
    saveUninitialized: false,
    secret: "mySecretSession",
    resave: false,
    store: sessionStore
});

app.use(middlewareSession);

let daoT = new daoTasks.DAOTasks(pool);
let daoU = new daoUsers.DAOUsers(pool);
let taskList = [];

const ficherosEstaticos = path.join(__dirname, "public");
const profile_imgs = path.join(__dirname, "profile_imgs");

function middleware(request, response, next){
    if(request.session.currentUser){
        response.locals.userEmail = request.session.currentUser;
        next();
    }else{
        response.redirect("login.html");
    }
}

app.use(express.static(ficherosEstaticos));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: false }));

app.post("/addTask", middleware, function(request, response){
    let newTask = taskUtils.createTask(request.body.taskText);
    newTask.done = false;
    daoT.insertTask(response.locals.userEmail, newTask, (err) => {
        if (!err) {
            response.status(200);
            response.redirect("/tasks.html");
        }
    });
});

app.post("/finish", function(request, response){
    daoT.markTaskDone(request.body.idTask, (err) => {
        if (!err) {
            response.status(200);
            response.redirect("/tasks.html");
        }
    });
});

app.post("/login", function(request, response){
    let email = request.body.mail;
    let password = request.body.pass;

    daoU.isUserCorrect(email, password, (err,result) => {
        if (err) {
            console.error(err);
        } else if (result) {
            response.status(200);
            request.session.currentUser = email;
            response.redirect("/tasks.html");
        } else {
            response.render("login", {errorMsg : "Dirección de correo y/o contraseña no válidos."})
        }
    });
});

app.get("/imagenUsuario", middleware, function(request, response){
    daoU.getUserImageName(response.locals.userEmail, (err, img) => {
        if(!err){
            if(img !== null){
                response.sendFile(path.join(profile_imgs, img));
            }else{
                response.sendFile("NoPerfil.jpg");
            }
        }
    });
});

app.get("/logout", function(request, response){
    response.status(200);
    request.session.destroy();
    response.redirect("/login.html");
});

app.get("/deleteCompleted", middleware, function(request, response){
    
    daoT.deleteCompleted(response.locals.userEmail, (err) => {
        if(!err){
            response.status(200);
            response.redirect("/tasks.html");
        }
    });
});

app.get("/tasks.html", middleware, function(request, response){
    daoT.getAllTasks(response.locals.userEmail, (err, tasks) => {
        if(!err){
            response.status(200);
            taskList = tasks;
            response.render("tasks", {tareas: taskList});
        }
    });
});

app.get("/login.html", function(request, response){
    response.status(200);
    response.render("login", {errorMsg: null});
});

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.")
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});