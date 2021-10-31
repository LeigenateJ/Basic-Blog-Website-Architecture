const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getUserLikeList(user_id){
    let db = await dbPromise;
    try{
        let user_like_list = await db.all(`select * from like_list where user_id = '${user_id}' `);
        return user_like_list
    }catch(err){
        console.log(err)
    }
    
}


// Export functions.
module.exports = {
    getUserLikeList
};
