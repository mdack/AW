/**
 * ============================
 * Ejercicio entregable 3.
 * Funciones de orden superior.
 * ============================
 * 
 * Puedes ejecutar los tests ejecutando `mocha` desde el directorio en el que se encuentra
 * el fichero `tareas.js`.
 */
"use strict";

let listaTareas = [
  { text: "Preparar práctica PDAP", tags: ["pdap", "practica"] },
  { text: "Mirar fechas congreso", done: true, tags: [] },
  { text: "Ir al supermercado", tags: ["personal"] },
  { text: "Mudanza", done: false, tags: ["personal"] },
];

/**
 * Devuelve las tareas de la lista de entrada que no hayan sido finalizadas.
 */
function getToDoTasks(tasks) {
  let listAux = tasks.filter(n => (!n.done || n.done === undefined));
  return listAux.map(n => n.text);
}

/**
 * Devuelve las tareas que contengan el tag especificado
 */
function findByTag(tasks, tag) {
  let listAux = tasks.filter(n =>  (n.tags.indexOf(tag) !== -1));
  return listAux;
}

/**
 * Devuelve las tareas que contengan alguno de los tags especificados
 */
function findByTags(tasks, tags) {
  let listAux = tasks.filter(n => n.tags.some(elem => tags.indexOf(elem) != -1));
  return listAux;
}

/**
 * Devuelve el número de tareas finalizadas
 */
function countDone(tasks) {
  return tasks.reduce((acum, elem) => {
  if(elem.done !== undefined && elem.done){
    acum = acum + 1;
  }
  return acum;
  }, 0);
}

/**
 * Construye una tarea a partir de un texto con tags de la forma "@tag"
 */
function createTask(text) {
    let tag = /@\S+/;
    let t = {};
    let word = tag.exec(texto);
    let tags = [];

   while(word !== null) {
      let conv = (word[0].replace("@", " ")).trim();
    texto = texto.replace(word[0], " ");
    tags.push(conv);
        word = tag.exec(texto);
    }

    t.text = texto.trim();
    t.tags = tags;
    return t;
}


/*
  NO MODIFICAR A PARTIR DE AQUI
  Es necesario para la ejecución de tests
*/
module.exports = {
  getToDoTasks: getToDoTasks,
  findByTag: findByTag,
  findByTags: findByTags,
  countDone: countDone,
  createTask: createTask
}