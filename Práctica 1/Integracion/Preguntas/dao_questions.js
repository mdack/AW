"use strict";


/**
 * Proporciona operaciones para la gestión de usuarios
 * en la base de datos.
 */
class DAOQuestions {
    /**
     * Inicializa el DAO de preguntas.
     * 
     * @param {Pool} pool Pool de conexiones MySQL. Todas las operaciones
     *                    sobre la BD se realizarán sobre este pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    addQuestion(idU, text, op, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql1 = "INSERT INTO `questions` (`id_question`, `id_user`, `question`) VALUES (NULL, ?, ?);"

                conexion.query(sql1, [idU, text], (err, result) => {
                    if(err){
                        callback(err);
                    }else{
                        let id_q = result.insertId;
                        const sql2 = "INSERT INTO `answers` (`id_answer`, `id_question`, `answer`) VALUES (NULL, ?, ?);";

                        for(let i = 0; i < op.length; i++){
                            
                            conexion.query(sql2, [id_q, op[i]], function(err){
                                if(err){
                                    callback(err);
                                }else if(i === (op.length -1)){
                                    conexion.release();
                                    callback(err);
                                }
                            });
                            
                        }
                    }
                });
            }
        });
    }

    randomQuestions(callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "SELECT * FROM `questions` ORDER BY RAND() LIMIT 5;"

                conexion.query(sql, [], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        callback(err, result);
                    }
                });
            }
        });
    }

    getQuestion(id_q, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "SELECT q.question, q.id_user, a.id_answer, a.answer FROM `questions` q, `answers` a WHERE q.id_question = a.id_question AND q.id_question = ?;";

                conexion.query(sql, [id_q], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        callback(err, result);
                    }
                });
            }
        });
    }

    isAnswered(id_q, id_u, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "SELECT * FROM `own_answers` oa,`answers` a WHERE a.id_answer = oa.id_answer AND a.id_question = ? AND oa.id_user = ?;";

                conexion.query(sql, [id_q, id_u], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        if(result.length > 0)
                            callback(err, true);
                        else
                            callback(err, false);
                    }
                });
            }
        });
    }

    getEnunQuestion(id_q, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "SELECT question FROM `questions` WHERE id_question = ?;";

                conexion.query(sql, [id_q], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        callback(err, result[0]);
                    }
                });
            }
        });
    }

    answerOwnQuestion(idU, idA, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "INSERT INTO `own_answers` (`id_user`, `id_answer`) VALUES(?, ?);";

                conexion.query(sql, [idU, idA], function(err){
                    conexion.release();
                    callback(err);
                });
            }
        });
    }

    insertOtherAnswer(idQ, answer, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                const sql = "INSERT INTO `answers` (`id_answer`, `id_question`, `answer`) VALUES(NULL,?, ?);";

                conexion.query(sql, [idQ, answer], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        callback(err, result.insertId);
                    }
                });
            }
        });
    }

}

module.exports = {
    DAOQuestions: DAOQuestions
}