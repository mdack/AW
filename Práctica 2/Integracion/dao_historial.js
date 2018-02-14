"use strict";

class DAOHistory {
    constructor(pool) {
        this.pool = pool;
    }

    insertEvent(idP, event, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql ="INSERT INTO `historial` (`id`, `idPartida`, `evento`, hora) VALUES (NULL, ?, ?, NULL);";
            
            connection.query(sql, [idP, event], function(err){
                connection.release();
                callback(err);
           });
        });
    }

    getHistory(idP, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql ="SELECT evento, hora FROM historial WHERE idPartida = ?";
            
            connection.query(sql, [idP], function(err, result){
                connection.release();
                if(err){
                    callback(err);
                }else{
                    callback(err, result);
                }
           });
        });
    }
}

module.exports = {
    DAOHistory: DAOHistory
};