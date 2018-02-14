class DAOGames {
    /**
     * Inicializa el DAO de usuarios.
     * 
     * @param {Pool} pool Pool de conexiones MySQL. Todas las operaciones
     *                    sobre la BD se realizarán sobre este pool.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /*
    statusGame(id, callback){
        this.pool.getConnection((err, conexion) => {
                if(err){
                    callback(err);
                }
                const sql = "SELECT u.login FROM partidas p, juega_en j, usuarios u WHERE j.idPartida = p.id AND p.id = ? AND j.idUsuario = u.id";
     
                conexion.query(sql, [id], function(err, resultado) {
                 conexion.release();
                 if(!err){
                    callback(err, resultado);
                 }else{
                     callback(err);
                 }
            });
        });
    
    }*/

    statusGame(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT estado FROM partidas WHERE id = ?";
 
            conexion.query(sql, [id], function(err, resultado) {
             conexion.release();
             if(!err){
                callback(err, resultado[0].estado);
             }else{
                 callback(err);
             }
            });
        });
    }

    getPlayers(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT u.login FROM partidas p, juega_en j, usuarios u WHERE j.idPartida = p.id AND p.id = ? AND j.idUsuario = u.id";
 
            conexion.query(sql, [id], function(err, resultado) {
             conexion.release();
             if(!err){
                callback(err, resultado);
             }else{
                 callback(err);
             }
        });
        });
    }

    insertGame(name, idU, callback){

        var status = JSON.stringify({
            host: idU
        });

        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql1 = "INSERT INTO `partidas`(`id`, `nombre`, `estado`) VALUES (NULL, ?, ?)";
            const sql2 = "INSERT INTO `juega_en`(`idUsuario`, `idPartida`) VALUES (?,?)";
 
            conexion.query(sql1, [name, status], function(err, resultado) {
                    if(!err){
                        console.log("NO-ERROR");
                        let idP = resultado.insertId;
                        conexion.query(sql2, [idU, idP], function(err, result){
                            if(!err){
                                console.log("sql2");
                                conexion.release();
                                callback(null, idP);
                            } else{
                                console.log(err);
                                callback(err);
                            }
                        });
                    }else{
                        console.log(err);
                        callback(err);
                    }
            });

        });
    }

    existsGame(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT * FROM partidas WHERE id = ?";
 
            conexion.query(sql, [id], function(err, resultado) {
                conexion.release();
                if(!err){
                    if(resultado.length > 0)
                        callback(err, true);
                    else{
                        callback(err, false);
                    }
                }else{
                    callback(err);
                }
            });
        });
    }

    insertPlayer(idP, idU, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "INSERT INTO `juega_en`(`idUsuario`, `idPartida`) VALUES (?,?)";
            const sql2 = "SELECT nombre FROM partidas WHERE id = ?;";
            conexion.query(sql, [idU, idP], function(err, result){
                if(!err){
                    conexion.query(sql2, idP, function(err, resultado){
                        conexion.release();
                        if(!err){                            
                            callback(null, resultado[0].nombre);
                        }else{
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        });
    }

    insertStatus(idP, info, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "UPDATE `partidas` SET estado = ? WHERE id = ?";
 
            conexion.query(sql, [info, idP], function(err, result){
                conexion.release();
                callback(err);
            });
        });
    }

}

module.exports = {
    DAOGames: DAOGames
}