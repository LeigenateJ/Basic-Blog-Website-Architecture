const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function getUserHateList(user_id){
    let db = await dbPromise;
    try{
        let user_hate_list = await db.all(`select * from hate_list where user_id = '${user_id}' `);
        return user_hate_list
    }catch(err){
        console.log(err)
    }
    
}


// Export functions.
module.exports = {
    getUserHateList
};
