const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");
const crypto=require('crypto');

/**
 * Inserts the given user into the database. Then, reads the ID which the database auto-assigned, and adds it
 * to the user.
 * 
 * @param user the user to insert
 */
async function createUser(user) {
    const db = await dbPromise;

    const newUser = await db.run(SQL`
    insert into user (user_name, fname, lname, dob, password_salting, avatar_path, description) values
    (${user.user_name}, ${user.fname}, ${user.lname}, ${user.DOB}, ${user.password_salting}, ${user.avatar_path}, ${user.description})
    `);

  
    
    return newUser;

}

async function getLastUserID(user) {
    const db = await dbPromise;
    let lastUserID = await db.get(SQL`
    select* from sqlite_sequence where name = 'user'
    `);
    if(lastUserID == undefined) {
        user.user_id = "1";
    } else{
        user.user_id = 1 + lastUserID.seq + "";
    }
    return user;
}

async function saltingUserPassword(user) {
    let hashing = crypto.createHash('SHA256').update(user.password).digest('hex');
    user.password_hashing = hashing;
    let user_id = "" + user.user_id;
    let salt = crypto.createHash('SHA256').update(user_id).digest('hex');
    let saltPassword = hashing.concat(salt);
    user.password_salting = crypto.createHash('SHA256').update(saltPassword).digest('hex');
    return user;
}

/**
 * Gets the user with the given username and password from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {string} username the user's username
 * @param {string} password the user's password
 */
async function retrieveUserWithCredentials(username, password_salting) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from user
        where user_name = ${username} and password_salting = ${password_salting}`);
    
    return user;
}

/**
 * Gets the user with the given authToken from the database.
 * If there is no such user, undefined will be returned.
 * 
 * @param {string} authToken the user's authentication token
 */
async function retrieveUserWithAuthToken(authToken) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from user
        where password_salting = ${authToken}`);

    return user;
}

async function retrieveUserByUsername(username) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from user
        where user_name = ${username}`);

    return user;
}

async function retrieveUserByUserid(userid) {
    const db = await dbPromise;

    const user = await db.get(SQL`
        select * from user
        where user_id = ${userid}`);

    return user;
}

/**
 * Deletes the user with the given id from the database.
 * 
 * @param {number} id the user's id
 */


async function updateUserById(user,user_id){
    const db = await dbPromise;
    
    try{
        let temp_user = await retrieveUserByUserid(user_id);
       

        if(user.user_name != ""){temp_user.user_name = user.user_name;}

        if(user.password != ""){
            temp_user.password = user.password;
            temp_user = await saltingUserPassword(temp_user);

           
        }

        if(user.avatar_path != ""){temp_user.avatar_path = user.avatar_path;}

        if(user.fname != ""){temp_user.fname = user.fname;}

        if(user.lname != ""){temp_user.lname = user.lname;}

        if(user.DOB != ""){temp_user.DOB = user.DOB;}

        if(user.description != ""){temp_user.description = user.description;}
      

        await db.run(SQL`update user set user_name = ${temp_user.user_name} , fname = ${temp_user.fname} , lname = ${temp_user.lname} , dob = ${temp_user.DOB}, password_salting = ${temp_user.password_salting} , avatar_path = ${temp_user.avatar_path} , description = ${temp_user.description} where user.user_id = ${user_id} `);
       
    }catch(err){
        console.log(err)
    }
}

async function deleteUserThingByID(user_id){
    const db = await dbPromise;
    await db.run(SQL`PRAGMA foreign_keys = ON`)
    await db.run(SQL`delete from user where user_id = ${user_id}`)
    await db.run(SQL`delete from like_list where user_id = ${user_id}`)
    await db.run(SQL`delete from hate_list where user_id = ${user_id}`)
    await db.run(SQL`delete from articles where user_id = ${user_id}`)
    await db.run(SQL`delete from comments where user_id = ${user_id}`)
    
}
async function findUserList(){
    const db = await dbPromise;
    try {
    const user_list = await db.all(SQL`SELECT user.user_id, user.user_name, fname, lname, dob, password_salting, user.avatar_path, admin, description, COUNT(article_id) AS 'numberOfArticles' 
    FROM user
    LEFT JOIN articles
    ON user.user_id = articles.user_id
    GROUP BY user.user_id;`);

    return user_list
    } catch(e) {
      console.error(e.message);
    }
}

async function isAdmin(user_id){
    const db = await dbPromise;

    const userList = await db.all(`select * from user where user_id = '${user_id}'`);
    if(userList.length==1){
        if(userList[0].admin ==1){
            return true
        }else{
            return false
        }
    }else{
        return false
    }
}

// Export functions.
module.exports = {
    createUser,
    getLastUserID,
    saltingUserPassword,
    retrieveUserWithCredentials,
    retrieveUserWithAuthToken,
    retrieveUserByUsername,
    retrieveUserByUserid,
    updateUserById,
    deleteUserThingByID,
    isAdmin,
    findUserList
};
