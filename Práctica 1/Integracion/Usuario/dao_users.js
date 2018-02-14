/**
* Milagros del Rocío Peña Quineche
* Juan Gómez-Martinho González
*/
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

    /**
     * Determina si un determinado usuario aparece en la BD con la contraseña
     * pasada como parámetro.
     * 
     * Es una operación asíncrona, de modo que se llamará a la función callback
     * pasando, por un lado, el objeto Error (si se produce, o null en caso contrario)
     * y, por otro lado, un booleano indicando el resultado de la operación
     * (true => el usuario existe, false => el usuario no existe o la contraseña es incorrecta)
     * En caso de error error, el segundo parámetro de la función callback será indefinido.
     * 
     * @param {string} email Identificador del usuario a buscar
     * @param {string} password Contraseña a comprobar
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    isUserCorrect(email, password, callback) {

       this.pool.getConnection((err, conexion) => {
           if(err){
               callback(err);
           }
           const sql = "SELECT * FROM user WHERE email = ? AND password = ?";

           conexion.query(sql, [email, password], function(err, resultado) {
            conexion.release();
            if(!err){
                callback(err, resultado[0]);
            }else{
                callback(err);
            }
           });
       });
        
    }

    /**
     * Busca un usuario por su identificador, si este existe devuelve todos los datos del mismo
     * sino lanza un error.
     * @param {number} id 
     * @param {function} callback 
     */
    findById(id, callback) {
        
               this.pool.getConnection((err, conexion) => {
                   if(err){
                       callback(err);
                   }
                   const sql = "SELECT * FROM user WHERE id = ?";
        
                   conexion.query(sql, [id], function(err, resultado) {
                    conexion.release();
                    if(!err){
                        callback(err, resultado[0]);
                    }else{
                        callback(err);
                    }
                   });
               });
                
    }

    findByEmailAndName(email, name, id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }
            const sql = "SELECT * FROM user WHERE email = ? AND name = ? AND id <> ?";
 
            conexion.query(sql, [email, name, id], function(err, resultado) {
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

    /**
     * Se encarga de buscar un usuario con un determinado nombre en la base de datos
     * devolviendo
     * @param {String} name
     * @param {function} callback 
     */
    findFriendsByName(id, callback) {
        
               this.pool.getConnection((err, conexion) => {
                   if(err){
                       callback(err);
                   }
                   const sql = "SELECT id, name FROM `user` u WHERE " +
                                "NOT EXISTS(SELECT * FROM `friends` f WHERE ((f.id_user = ? AND f.id_friend = u.id) OR (f.id_user = u.id AND f.id_friend = ?))) AND u.id <> ?;";

                   conexion.query(sql, [id, id, id], function(err, resultado) {
                    if(!err){
                        conexion.release();
                        callback(err, resultado);
                    }else{
                        callback(err);
                    }

                   });
               });
                
    }

    /**
     * Añade una solicitud de amistad para el usuario idFriend de parte del usuario
     * idUser.
     * 
     * @param {Number} idUser Usuario que solicita amistad
     * @param {Number} idFriend Usuario con el que quiere entablar amistad
     * @param {*} callback Devuelve el error que se haya generado si es que ha ocurrido.
     */
    addFriend(idUser, idFriend, callback){
        this.pool.getConnection((err, conexion) => {
            if(err)
                callback(err);
            else{
                const sql= "INSERT INTO `friends` (`id_user`, `id_friend`, `status_code`) VALUES (?, ?, 0)";
                
                conexion.query(sql, [idUser, idFriend], function(err){
                    conexion.release();
                    callback(err);
                });

            }
        });
    }

    /**
     * Responde a la solicitud de amistad recibida, si la rechaza se 
     * borrará de la base de datos.
     * @param {*} idUser 
     * @param {*} idFriend 
     * @param {*} status 
     * @param {*} callback 
     */
    answerRequest(idUser, idFriend, status, callback){
        this.pool.getConnection((err, conexion) => {
            if(err){
                callback(err);
            }else{
                let sql = "";

                if(status === 1)
                    sql = "UPDATE `friends` SET `status_code` = 1 WHERE `id_user`= ? and `id_friend` = ?;";
                else
                    sql = "DELETE FROM `friends` WHERE `id_user` = ? and `id_friend` = ?;";

                conexion.query(sql, [idFriend, idUser], function(err){
                    conexion.release();
                    callback(err);
                });
            }
        });
    }


    /**
     * Busca los amigos del usuario con idUser.
     * @param {Number} idUser 
     * @param {*} callback 
     */
    findMyFriends(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err)
                callback(err);
            else{
                const sql= "SELECT u.id, u.name FROM `user` u LEFT JOIN `friends` f ON (u.id = f.id_friend or u.id = f.id_user) WHERE u.id <> ? and (f.id_user = ? or f.id_friend = ?) and f.status_code = 1;";
                conexion.query(sql, [id, id, id], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        let f = [];
                        let u = null;
                        result.forEach(res => {
                            u = {id: res.id, name: res.name};
                           f.push(u);
                        });
                        callback(err, f);
                    }

                });
            }
        });
    }
    
    findMyPhotos(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err)
                callback(err);
            else{
                const sql= "SELECT p.id, p.photo, p.descr FROM `photos` p WHERE p.user_id = ?";
                conexion.query(sql, [id], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        let f = [];
                        let u = null;
                        result.forEach(res => {
                            u = {id: res.id, photo: res.photo, descr: res.descr};
                           f.push(u);
                        });
                        callback(err, f);
                    }

                });
            }
        });
    }

    findMyRequests(id, callback){
        this.pool.getConnection((err, conexion) => {
            if(err)
                callback(err);
            else{
                const sql= "SELECT u.id, u.name FROM `user` u LEFT JOIN `friends` f ON u.id = f.id_user WHERE u.id <> ? and f.id_friend = ? and f.status_code = 0;";
                conexion.query(sql, [id, id], function(err, result){
                    conexion.release();
                    if(err){
                        callback(err);
                    }else{
                        let f = [];
                        let u = null;
                        result.forEach(res => {
                            u = {id: res.id, name: res.name};
                           f.push(u);
                        });
                        callback(err, f);
                    }

                });
            }
        });
    }


    /**
     * Obtiene el nombre de fichero que contiene la imagen de perfil de un usuario.
     * 
     * Es una operación asíncrona, de modo que se llamará a la función callback
     * pasando, por un lado, el objeto Error (si se produce, o null en caso contrario)
     * y, por otro lado, una cadena con el nombre de la imagen de perfil (o undefined
     * en caso de producirse un error).
     * 
     * @param {number} id Identificador del usuario cuya imagen se quiere obtener
     * @param {function} callback Función que recibirá el objeto error y el resultado
     */
    getUserImage(id, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(err); return; }
            connection.query("SELECT img FROM user WHERE id = ?",
            [id],
            (err, rows) => {
                if (err) { callback(err); return; }
                connection.release();
                if (rows.length === 0) {
                    callback(null, undefined);
                } else {
                    callback(null, rows[0].img);
                }
            });
        });
    }   
    
    getPhoto(id, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { callback(err); return; }
            connection.query("SELECT photo FROM photos WHERE id = ?",
            [id],
            (err, rows) => {
                if (err) { callback(err); return; }
                connection.release();
                if (rows.length === 0) {
                    callback(null, undefined);
                } else {
                    callback(null, rows[0].photo);
                }
            });
        });
    }   

    insertUser(user, callback) {
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql ="INSERT INTO `user` (`id`, `email`, `password`, `name`, `gender`, `dob`, `puntos`, `img`) VALUES (NULL, ?, ?, ?, ?, ?, 0, ?);";
            
            connection.query(sql, [user.email, user.password, user.name, user.gender, user.dob, user.img], function(err, result){
                connection.release();
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.insertId);
                }
           });
        });
    } 
    
    modifyUser(user, callback){
        
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }

            let sql = "";

            if(user.change){
                sql = "UPDATE `user` SET `email`= ?,`password`= ?,`name`= ?,`gender`= ?,`dob`= ?,`img`= ? WHERE id = ?";
                connection.query(sql, [user.email, user.password, user.name, user.gender, user.dob, user.img, user.id], function(err, result){
                    connection.release();
                    callback(err);
                });
            }else{
                sql = "UPDATE `user` SET `email`= ?,`password`= ?,`name`= ?,`gender`= ?,`dob`= ? WHERE id = ?";
                connection.query(sql, [user.email, user.password, user.name, user.gender, user.dob, user.id], function(err, result){
                    connection.release();
                    callback(err);
                });
            }
        });
    }
    
    insertPhoto(data, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql ="INSERT INTO `photos` (`id`, `user_id`, `photo`, `descr`) VALUES (NULL, ?, ?, ?);";
            
            connection.query(sql, [data.id, data.img, data.descr], function(err, result){
                connection.release();
                if (err) {
                    callback(err);
                } else {
                    callback(null, result.insertId);
                }
           });
        });
    }
    reducePoints(points, id, callback){
       this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
            }
            const sql = "UPDATE `user` SET `puntos`= ? WHERE id = ?";
            const p = points-100;
            connection.query(sql, [p, id], function(err, result){
                connection.release();
                callback(err);
           });
        }); 
    }
    
}

module.exports = {
    DAOUsers: DAOUsers
}