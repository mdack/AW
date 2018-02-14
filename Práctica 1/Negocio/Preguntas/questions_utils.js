"use strict";

function getAnswers(text){
    let lineas = text.split('\n');
    let op = [];

    for(let i = 0; i < lineas.length; i++){
        op.push(lineas[i]);
    }
    return op;
}

module.exports = {
    getAnswers: getAnswers
}