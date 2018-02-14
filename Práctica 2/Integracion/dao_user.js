"use strict";


/**
 * Proporciona operaciones para la gestión de usuarios
 * en la base de datos.
 */
class DAOUsers {
    /**
     * Inicializa el DAO de usuarios.
     * 
     * @param {Pool} pool Pool de conexiones MySQL. Todas las operaciones
     *                    sobre la BD se realizarán sobre este pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    findUser(login, pass, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT * FROM usuarios WHERE login = ? AND password = ?";
 
            conexion.query(sql, [login, pass], function(err, resultado) {
                conexion.release();
                if(!err){
                    if(resultado.length  > 0)
                        callback(err, true, resultado[0].id);
                    else
                        callback(err, false, null);
                }else{
                    callback(err);
                }
            });
        });
    }

    /**
     * Busca a un usuario por su nombre de usuario
     * @param {*} login 
     * @param {*} callback 
     */
    findByLogin(login, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT * FROM usuarios WHERE login = ?";
 
            conexion.query(sql, [login], function(err, resultado) {
             conexion.release();
             if(!err){
                 if(resultado.length  > 0)
                    callback(err, true);
                else
                    callback(err, false);
             }else{
                 callback(err);
             }
            });
        });
    }

    insertUser(login, pass, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql ="INSERT INTO `usuarios` (`id`, `login`, `password`) VALUES (NULL, ?, ?);";
            
            connection.query(sql, [login, pass], function(err, result){
                connection.release();
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.insertId);
                }
           });
        });
    }


    getGames(login, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT p.id, p.nombre FROM usuarios u, juega_en j, partidas p WHERE u.id = ? AND u.id = j.idUsuario AND j.idPartida = p.id";
 
            conexion.query(sql, [login], function(err, resultado) {
             conexion.release();
             if(!err){
                callback(null,resultado);
             }else{
                 callback(err);
             }
            });
        });
    }
}

module.exports = {
    DAOUsers: DAOUsers
}