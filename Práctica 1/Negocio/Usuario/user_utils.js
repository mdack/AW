"use strict"

function calulateAge(fecha){

        let dia =fecha.getDate();
        let mes =fecha.getMonth() + 1;
        let ano =fecha.getFullYear();
 
        // cogemos los valores actuales
        let fecha_hoy = new Date();
        let ahora_ano = fecha_hoy.getYear();
        let ahora_mes = fecha_hoy.getMonth()+1;
        let ahora_dia = fecha_hoy.getDate();
 
        // realizamos el calculo
        let edad = (ahora_ano + 1900) - ano;
        if ( ahora_mes < mes )
        {
            edad--;
        }
        if ((mes == ahora_mes) && (ahora_dia < dia))
        {
            edad--;
        }
        if (edad > 1900)
        {
            edad -= 1900;
        }

    return edad;
}

function parseDOB(fecha){

    let cadena = "";

    cadena += fecha.getFullYear() + "-";
    let mes =fecha.getMonth() + 1;
    if(mes > 9)
        cadena += mes + "-";
    else
        cadena += "0" + mes + "-";

    let dia = fecha.getDate();
    if(dia > 9)
        cadena += dia;
    else
        cadena += "0" + dia;

    return cadena;
}

function findUsersByName(name, list){
    let result = list.filter(user => {
                    let expre = new RegExp(name, "igm");
                    if(expre.test(user.name)){
                        return true;
                    }else{
                        return false;
                    }
                });

    return result;
}

module.exports = {
    calulateAge: calulateAge,
    parseDOB: parseDOB,
    findUsersByName : findUsersByName
}