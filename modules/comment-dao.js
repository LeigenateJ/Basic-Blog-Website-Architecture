const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");
const articlesDao = require("../modules/articles-dao.js")
const likeDao = require("../modules/like-dao.js")
const hateDao = require("../modules/hate-dao.js")

async function createComment(comment) {
    const db = await dbPromise;
   
    const result = await db.run(SQL`
        insert into comments (comment_text, post_time, article_id, upper_comment_id, user_id, user_name, avatar_path,up_num,down_num) values
        (${comment.comment_text}, ${comment.post_time}, ${comment.article_id}, ${comment.upper_comment_id}, ${comment.user_id}, ${comment.user_name}, ${comment.avatar_path},0,0)
        `);

    const lastComment = await db.get(SQL`
    SELECT * FROM comments ORDER BY comment_id DESC LIMIT 1
    `);
    return lastComment;    
}

async function updateLikeOfComment(comment) {
    const db = await dbPromise;

    const result = await db.run(`update comments set up_num = ${comment.up_num} where comment_id = ${comment.comment_id}`);
}

async function updateHateOfComment(comment) {
    const db = await dbPromise;

    const result = await db.run(`update comments set down_num = ${comment.down_num} where comment_id = ${comment.comment_id}`);
}

async function generateEachCommentsByArticles(articles) {

    let data = makeArray(articles);

    for(let i = 0; i < data.length; i++) {
        data[i].commentsForArticle = await generateCommentsOfArticle(data[i].article_id);
    }

    return data;
}

async function generateCommentsOfArticle(article_id) {

    let commentsForArticle = await getFirstLevelCommentsByArticleID(article_id);

    if(commentsForArticle.length == 0) {
        return null;
    };

    for (let i = 0; i < commentsForArticle.length; i++){

        let secondLevelComments = await getInnerCommentsByCommentID(commentsForArticle[i].comment_id);

        if(secondLevelComments.length == 0) {
            continue
        };

        commentsForArticle[i].innerComments = secondLevelComments;

        for(let j = 0; j < secondLevelComments.length; j++) {
            let thirdLevelComments = await getInnerCommentsByCommentID(commentsForArticle[i].innerComments[j].comment_id);

            if(thirdLevelComments.length == 0) {
                continue;
            };

            commentsForArticle[i].innerComments[j].innerComments = thirdLevelComments;
        }

    }

        return commentsForArticle;
}

async function retrieveCommentByCommentID(comment_id) {
    const db = await dbPromise;
    
    const comment = await db.get(SQL`
    select * from comments
    where comment_id = ${comment_id}`);
    
    return comment;
}

async function getFirstLevelCommentsByArticleID(article_id) {
    let db = await dbPromise;

    let FLcommentsDetail = await db.all(SQL`
    SELECT* FROM comments WHERE comments.article_id = ${article_id} and comments.upper_comment_id is NULL order by (up_num - down_num) DESC;
    `);

    return FLcommentsDetail;
}

async function getInnerCommentsByCommentID(comment_id) {
    let db = await dbPromise;

    let innercommentsDetail = await db.all(SQL`
    SELECT* FROM comments WHERE comments.upper_comment_id = ${comment_id} order by (up_num - down_num) DESC
    `);

    return innercommentsDetail;
}

function makeArray(input) {
    if (input === undefined) {
        return [];
    }
    else if (Array.isArray(input)) {
        return input;
    }
    else {
        return [input];
    }
}

async function searchCommentByArticleId(acticlesId, user_id){
    let result = await generateCommentsOfArticle(acticlesId);
    result = await addStatusOnCommentsForUser(result, user_id);
    result = await addDeleteStatusOnCommentsForUser(result, acticlesId, user_id);
    return result
    
}

async function addStatusOnCommentsForUser(comments, user_id){
    if(comments == null){return null;}

    let login_user_like_list =  await likeDao.getUserLikeList(user_id);
    let login_user_hate_list =  await hateDao.getUserHateList(user_id);
    if(login_user_like_list.length == 0 && login_user_hate_list == 0){return comments;}

    if(login_user_like_list.length != 0) {
        for(let i = 0; i < login_user_like_list.length; i++){
            let comment_id = login_user_like_list[i].comment_id;
            for(let j = 0; j < comments.length; j++){
                if(comments[j].comment_id == comment_id){
                    comments[j].good = true;
                }
                if(comments[j].innerComments != undefined){
                    for(let k = 0; k < comments[j].innerComments.length; k++){
                        if(comments[j].innerComments[k].comment_id == comment_id){
                            comments[j].innerComments[k].good = true;
                        }
                        if(comments[j].innerComments[k].innerComments != undefined){
                            for(let m = 0; m < comments[j].innerComments[k].innerComments.length; m++){
                                if(comments[j].innerComments[k].innerComments[m].comment_id == comment_id){
                                    comments[j].innerComments[k].innerComments[m].good = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    if(login_user_hate_list.length != 0) {
        for(let i = 0; i < login_user_hate_list.length; i++){
            let comment_id = login_user_hate_list[i].comment_id;
            for(let j = 0; j < comments.length; j++){
                if(comments[j].comment_id == comment_id){
                    comments[j].bad = true;
                   
                }
                if(comments[j].innerComments != undefined){
                    for(let k = 0; k < comments[j].innerComments.length; k++){
                        if(comments[j].innerComments[k].comment_id == comment_id){
                            comments[j].innerComments[k].bad = true;
                           
                        }
                        if(comments[j].innerComments[k].innerComments != undefined){
                            for(let m = 0; m < comments[j].innerComments[k].innerComments.length; m++){
                                if(comments[j].innerComments[k].innerComments[m].comment_id == comment_id){
                                    comments[j].innerComments[k].innerComments[m].bad = true;
                                    
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return comments;

}

async function addDeleteStatusOnCommentsForUser(comments, article_id, user_id){
    if(comments == null){return null;}

    let author = await articlesDao.retrieveArticleByArticleid(article_id);

    for(let i = 0; i < comments.length; i++){
        if(comments[i].user_id == user_id || user_id == author.user_id){
            comments[i].isDelete = true;
        }
        if(comments[i].innerComments != undefined){
            for(let j = 0; j < comments[i].innerComments.length; j++){
                if(comments[i].innerComments[j].user_id == user_id || user_id == author.user_id){
                    comments[i].innerComments[j].isDelete = true;
                }
                if(comments[i].innerComments[j].innerComments != undefined){
                    for(let k = 0; k < comments[i].innerComments[j].innerComments.length; k++){
                        if(comments[i].innerComments[j].innerComments[k].user_id == user_id || user_id == author.user_id){
                            comments[i].innerComments[j].innerComments[k].isDelete = true;
                        }
                    }
                }
            }
        }
    }

    return comments;

}

async function addordeletelike(user_id,article_id,comment_id,number){
    let db = await dbPromise;
   
    let hateList = await db.all(`select * from hate_list where user_id = ${user_id} and comment_id = ${comment_id} `)
    if(hateList.length>0){
        return
    }
    let list  =await db.all(`select * from like_list where user_id = ${user_id} and comment_id = ${comment_id} `)
    if(list.length>0){
        // delete 
        try{
            let up = number==0?0:(number*1)-1
            let delectLikeList = await db.all(`delete from like_list where user_id = '${user_id}' and comment_id = '${comment_id}'`)
            let updateComment = await db.all(`update comments set up_num = '${up}' where comment_id = '${comment_id}'`)
        }catch(err){
           
        }
       
    }else{
        // add
        try{
            let up = number*1+1
            let addLikeList = await db.all(`
            insert into like_list (user_id, comment_id) values
            (${user_id}, ${comment_id})
            `)
            let updateComment = await db.all(`update comments set up_num = '${up}' where comment_id = '${comment_id}'`)
        }catch(err){
         
        }
    }
    
}

async function addordeleteHate(user_id,article_id,comment_id,number){
    let db = await dbPromise;
   
    let likeList = await db.all(`select * from like_list where user_id = ${user_id} and comment_id = ${comment_id} `)
    if(likeList.length>0){
        return
    }
    let list  =await db.all(`select * from hate_list where user_id = ${user_id} and comment_id = ${comment_id} `)
    if(list.length>0){
        // delete 
        try{
            let down_num = number==0?0:(number*1)-1
            let delectLikeList = await db.all(`delete from hate_list where user_id = '${user_id}' and comment_id = '${comment_id}'`)
            let updateComment = await db.all(`update comments set down_num = '${down_num}' where comment_id = '${comment_id}'`)
        }catch(err){
            console.log(err)
        }
       
    }else{
        // add
        try{
            let down_num = number*1+1
            let addLikeList = await db.all(`
            insert into hate_list (user_id, comment_id) values
            (${user_id}, ${comment_id})
            `)
            let updateComment = await db.all(`update comments set down_num = '${down_num}' where comment_id = '${comment_id}'`)
        }catch(err){
            console.log(err)
        }
    }
    
}
async function deleteComment(id){
    let db = await dbPromise;
    let runCascade = await db.run(`PRAGMA foreign_keys = ON`);
    let deleteId = await db.all(`delete  from comments where comment_id = ${id} `);
}

// Export functions.
module.exports = {
    updateLikeOfComment,
    updateHateOfComment,
    getInnerCommentsByCommentID,
    generateEachCommentsByArticles,
    generateCommentsOfArticle,
    createComment,
    retrieveCommentByCommentID,
    searchCommentByArticleId,
    addordeletelike,
    addordeleteHate,
    deleteComment
};
