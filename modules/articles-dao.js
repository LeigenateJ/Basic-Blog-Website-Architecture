const SQL = require("sql-template-strings");
const dbPromise = require("./database.js");

async function retrieveArticleByUserid(userid) {
    const db = await dbPromise;

    const articles = await db.all(SQL`
        select * from articles
        where user_id = ${userid}`);

    return articles;
}

async function createNewArticle(article) {
    const db = await dbPromise;

    await db.run(SQL`
        INSERT INTO articles
        (heading, article_text, post_time, user_id, user_name, avatar_path, img_path) VALUES
        (${article.heading}, ${article.article_text}, ${article.post_time}, ${article.user_id}, 
        ${article.user_name}, ${article.avatar_path},${article.img_path});`);
}

async function updateArticleByArticleid(articleid, article) {
    const db = await dbPromise;

    await db.run(SQL`
        UPDATE articles SET
        heading=${article.heading}, 
        article_text=${article.article_text}, 
        post_time=${article.post_time}, 
        user_id=${article.user_id}, 
        user_name=${article.user_name}, 
        avatar_path=${article.avatar_path}, 
        img_path=${article.img_path}
        WHERE article_id = ${articleid};`);
}

async function retrieveAllArticles() {
    const db = await dbPromise;
    const articles = await db.all(SQL`
        select * from articles`);

    return articles;
}

async function retrieveArticlesSortByTitle() {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select article_id from articles
    order by heading`);
   
    return articles;
}

async function retrieveArticlesSortByUsername() {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select article_id from articles
    order by user_name`);
   
    return articles;
}

async function retrieveArticlesSortByDate() {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select article_id from articles
    order by post_time`);
   
    return articles;
}
async function retrieveMyArticlesSortByTitle(userid) {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select article_id from articles where user_id = ${userid}
    order by heading `);

    return articles;
}

async function retrieveMyArticlesSortByUsername(userid) {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select * from articles where user_id = ${userid}
    order by user_name`);

    return articles;
}

async function retrieveMyArticlesSortByDate(userid) {
    const db = await dbPromise;
    const articles = await db.all(SQL`
    select * from articles where user_id = ${userid}
    order by post_time`);

    return articles;
}

async function retrieveArticleByArticleid(articleid) {
    const db = await dbPromise;
    const articles = await db.get(SQL`
        select * from articles
        where article_id = ${articleid}`);

    return articles;
}

async function deleteArticleByArticleid(articleid) {
    const db = await dbPromise;
    await db.run(SQL`PRAGMA foreign_keys = ON`);
    await db.run(SQL`
    DELETE from articles where article_id = ${articleid};
    `);
    
    
}

// Export functions.
module.exports = {
    retrieveArticleByUserid,
    retrieveAllArticles,
    createNewArticle,
    updateArticleByArticleid,
    retrieveArticlesSortByTitle,
    retrieveArticlesSortByUsername,
    retrieveArticlesSortByDate,
    retrieveMyArticlesSortByTitle,
    retrieveMyArticlesSortByUsername,
    retrieveMyArticlesSortByDate,
    retrieveArticleByArticleid,
    deleteArticleByArticleid
};