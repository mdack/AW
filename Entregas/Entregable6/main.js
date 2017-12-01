const express = require("express");
const mysql = require("mysql");
const path = require("path");
const bodyParser = require("body-parser");
const config = require("./config");
const daoTasks = require("./dao_tasks");
const taskUtils = require("./task_utils");

const app = express();

let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
});

let daoT = new daoTasks.DAOTasks(pool);
let taskList = [];

const ficherosEstaticos = path.join(__dirname, "public");

app.use(express.static(ficherosEstaticos));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: false }));

app.post("/addTask", function(request, response){
    let newTask = taskUtils.createTask(request.body.taskText);
    newTask.done = false;
    daoT.insertTask("usuario@ucm.es", newTask, (err) => {
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


app.get("/deleteCompleted", function(request, response){
    
    daoT.deleteCompleted("usuario@ucm.es", (err) => {
        if(!err){
            response.status(200);
            response.redirect("/tasks.html");
        }
    });
});

app.get("/tasks.html", function(request, response){
    
    daoT.getAllTasks("usuario@ucm.es", (err, tasks) => {
        if(!err){
            response.status(200);
            taskList = tasks;
            response.render("tasks", {tareas: taskList});
        }
    });
});

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.")
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});