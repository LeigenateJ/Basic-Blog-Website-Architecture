const express = require("express");
const router = express.Router();

const userDao = require("../modules/user-dao.js");
const articlesDao = require("../modules/articles-dao.js")
const commentDao = require("../modules/comment-dao.js")
const { verifyAuthenticated } = require("../middleware/auth-middleware.js");
// Setup multer (files will temporarily be saved in the "temp" folder).
const path = require("path");
const multer = require("multer");
const upload = multer({
    dest: path.join(__dirname, "temp")
});
// Setup fs
const fs = require("fs");
const moment = require("moment");
// const { response } = require("express");


router.get("/", async function (req, res) {
    res.locals.articles = await articlesDao.retrieveAllArticles();
    for (let i = 0; i < res.locals.articles.length; i++) {
        res.locals.articles[i].user = await userDao.retrieveUserByUserid(res.locals.articles[i].user_id);
        res.locals.articles[i].commentList = await commentDao.searchCommentByArticleId(res.locals.articles[i].article_id,res.locals.user?req.cookies.userId:null);
    };
    if (res.locals.user) {
        res.render("home");
    } else {
        res.render("homeBeforeLogin");
    }
});
//user accounts
router.get("/userExist", async function (req, res) {
    const username = req.query.username;
    if (username != "") {
        const user = await userDao.retrieveUserByUsername(username);
        if (!user) {
            res.send('v');
        } else {
            res.send('i');
        }
    }
});
router.get("/login", async function (req, res) {
    if (res.locals.user) {
        res.redirect("/");
    } else {
        res.locals.message = req.query.message;
        res.render("login");
    }
});

router.post("/login", async function (req, res) {
    const username = req.body.username;
    let temp_user = await userDao.retrieveUserByUsername(username);
    if (temp_user == undefined) {
        res.redirect("./login?message=User name does not exist!");
    }
    temp_user.password = req.body.password;
    temp_user = await userDao.saltingUserPassword(temp_user);
    const password_salting = temp_user.password_salting;
    const user = await userDao.retrieveUserWithCredentials(username, password_salting);
   
    // if there is a matching user...
    if (user) {
        res.cookie("authToken", password_salting);
        res.cookie("userId", user.user_id);
       
        res.locals.user = user;
        
        res.redirect("/");

    }

    // Otherwise, if there's no matching user...
    else {
        // Auth fail
        res.redirect("./login?message=Authentication failed!");
    }
});

router.get("/logout", function (req, res) {
    res.clearCookie("authToken");
    res.clearCookie("userId");
    res.locals.user = null;
    res.redirect("./login?message=Successfully logged out!");
});

router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/createNewAccount", async function (req, res) {

    try {
      
        let user = req.body;
        user = await userDao.getLastUserID(user);
       
        user = await userDao.saltingUserPassword(user);
       
        await userDao.createUser(user);

        res.cookie("authToken", user.password_salting);
        res.cookie("userId", user.user_id);
       
        res.locals.user = user;
      
        res.redirect("/");
    }
    catch (err) {
        res.redirect(`./login?message=${err}`);
    }
});

router.get("/editAccount", verifyAuthenticated, function (req, res) {
 
    res.render("editAccount");
});

router.post("/updateUser", async function (req, res) {
    try {
       
        let result = await userDao.updateUserById(req.body, req.cookies.userId);
        let user = await userDao.retrieveUserByUserid(req.cookies.userId);
       
        res.cookie("authToken", user.password_salting);
        res.locals.user = user;
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})

router.post("/deleteUser", async function (req, res) {
    try {
        await userDao.deleteUserThingByID(req.cookies.userId);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
})




//articles
router.post("/postNewArticles", upload.single("imageFile"), async function (req, res) {
    var d = new Date();
    var n = d.toLocaleString("sv-SE");
    const heading = req.body.articleTitle;
    const article_text = req.body.content;
    const post_time = n;
    const user_id = res.locals.user.user_id;
    const user_name = res.locals.user.user_name;
    const avatar_path = res.locals.user.avatar_path;
    let article = null;


    if (req.file) {
        const fileInfo = req.file;
        // Move the file somewhere more sensible
        const oldFileName = fileInfo.path;
        const newOringinalName = fileInfo.originalname.replace(/\s+/g,"");
        const newFileName = `./public/images/${newOringinalName}`;
        fs.renameSync(oldFileName, newFileName);
        const img_path = `../images/${newOringinalName}`;
        article = {
            heading: heading,
            article_text: article_text,
            post_time: post_time,
            user_id: user_id,
            user_name: user_name,
            avatar_path: avatar_path,
            img_path: img_path
        };

    } else {
        article = {
            heading: heading,
            article_text: article_text,
            post_time: post_time,
            user_id: user_id,
            user_name: user_name,
            avatar_path: avatar_path,
            img_path: null
        }
    }

    await articlesDao.createNewArticle(article);
    res.locals.articles = await articlesDao.retrieveAllArticles();
    for (let i = 0; i < res.locals.articles.length; i++) {
        res.locals.articles[i].user = await userDao.retrieveUserByUserid(res.locals.articles[i].user_id);
    };
    res.render("home");
});

router.post("/saveArticle", upload.single("imageFile"), async function (req, res) {
    var d = new Date();
    var n = d.toLocaleString("sv-SE");
    const heading = req.body.articleTitle;
    const article_text = req.body.content;
    const post_time = n;
    const user_id = res.locals.user.user_id;
    const user_name = res.locals.user.user_name;
    const avatar_path = res.locals.user.avatar_path;
    let article = null;

    if (req.file) {
        const fileInfo = req.file;
        // Move the file somewhere more sensible
        const oldFileName = fileInfo.path;
        const newOringinalName = fileInfo.originalname.replace(/\s+/g,"");
        const newFileName = `./public/images/${newOringinalName}`;
        fs.renameSync(oldFileName, newFileName);
        const img_path = `../images/${newOringinalName}`;
        article = {
            heading: heading,
            article_text: article_text,
            post_time: post_time,
            user_id: user_id,
            user_name: user_name,
            avatar_path: avatar_path,
            img_path: img_path
        };
    } else {
        if (req.body.oldImageFile == "") {
            article = {
                heading: heading,
                article_text: article_text,
                post_time: post_time,
                user_id: user_id,
                user_name: user_name,
                avatar_path: avatar_path,
                img_path: null
            }
        } else {
            article = {
                heading: heading,
                article_text: article_text,
                post_time: post_time,
                user_id: user_id,
                user_name: user_name,
                avatar_path: avatar_path,
                img_path: req.body.oldImageFile
            }
        }
    }

    await articlesDao.updateArticleByArticleid(req.query.articleId, article);
    res.locals.articles = await articlesDao.retrieveAllArticles();
    for (let i = 0; i < res.locals.articles.length; i++) {
        res.locals.articles[i].user = await userDao.retrieveUserByUserid(res.locals.articles[i].user_id);
    };
    res.redirect("./myBlogs");
});

router.get("/addNewArticles", verifyAuthenticated, async function (req, res) {
    res.render("addNewArticles");
});

router.get("/myBlogs", verifyAuthenticated, async function (req, res) {
    res.locals.articles = await articlesDao.retrieveArticleByUserid(res.locals.user.user_id);
    for (let i = 0; i < res.locals.articles.length; i++) {
        res.locals.articles[i].user = await userDao.retrieveUserByUserid(res.locals.articles[i].user_id);
        res.locals.articles[i].commentList = await commentDao.searchCommentByArticleId(res.locals.articles[i].article_id, req.cookies.userId);
    }

    res.render("myBlogs");
});

router.get("/allBlogs", verifyAuthenticated, async function (req, res) {
    res.locals.articles = await articlesDao.retrieveAllArticles();
    for (let i = 0; i < res.locals.articles.length; i++) {
        res.locals.articles[i].user = await userDao.retrieveUserByUserid(res.locals.articles[i].user_id);
        res.locals.articles[i].commentList = await commentDao.searchCommentByArticleId(res.locals.articles[i].article_id, req.cookies.userId);
    };

    res.render("home");

});

router.get("/sort", async function (req, res) {
    let articles;
    switch (req.query.by) {
        case 'title':
            articles = await articlesDao.retrieveArticlesSortByTitle();
            break;
        case 'username':
            articles = await articlesDao.retrieveArticlesSortByUsername();
            break;
        case 'date':
            articles = await articlesDao.retrieveArticlesSortByDate();
            break;
        default:
            articles = await articlesDao.retrieveAllArticles();
    }
    let listOrder = articles;
    res.json(listOrder);
});
router.get("/sortMyArticles", verifyAuthenticated, async function (req, res) {
    let articles;
    switch (req.query.by) {
        case 'title':
            articles = await articlesDao.retrieveMyArticlesSortByTitle(res.locals.user.user_id);
            break;
        case 'username':
            articles = await articlesDao.retrieveMyArticlesSortByUsername(res.locals.user.user_id);
            break;
        case 'date':
            articles = await articlesDao.retrieveMyArticlesSortByDate(res.locals.user.user_id);
            break;
        default:
            articles = await articlesDao.retrieveArticleByUserid(res.locals.user.user_id);
    }
    for (let i = 0; i < articles.length; i++) {
        articles[i].user = await userDao.retrieveUserByUserid(articles[i].user_id);
        articles[i].commentList = await commentDao.searchCommentByArticleId(articles[i].article_id);
    };
    res.json(articles);
});

router.get("/editArticle", verifyAuthenticated, async function (req, res) {
    res.locals.article = await articlesDao.retrieveArticleByArticleid(req.query.articleId);
    res.render("editArticle");
});

router.get("/deleteArticle", verifyAuthenticated, async function (req, res) {
    await articlesDao.deleteArticleByArticleid(req.query.articleId);
    res.redirect("./myBlogs");
});



//comments
//update like num
router.get("/addordeleteLike",verifyAuthenticated, async function(req,res){
   
    let result = await commentDao.addordeletelike(req.cookies.userId,req.query.article_id,req.query.comment_id,req.query.up_num);
    let info = await commentDao.retrieveCommentByCommentID(req.query.comment_id);
   
    res.json(info);
})

//update hate num
router.get("/addordeleteHate",verifyAuthenticated, async function(req,res){

    let result = await commentDao.addordeleteHate(req.cookies.userId,req.query.article_id,req.query.comment_id,req.query.down_num)
    let info = await commentDao.retrieveCommentByCommentID(req.query.comment_id);
  
    res.json(info);
})

router.post("/commitbyone",verifyAuthenticated,async function(req,res){
    req.body.post_time = moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss")
    let result = await commentDao.createComment({...req.body,...res.locals.user})

    res.json(result);
})

router.post("/commitbytwo",verifyAuthenticated,async function(req,res){
    req.body.post_time = moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss")
    let result = await commentDao.createComment({...req.body,...res.locals.user})

    res.json(result);
})
router.post("/deleteComment",verifyAuthenticated,async function(req,res){
    let result = await commentDao.deleteComment(req.body.comment_id);
    return "sucsess";
})

module.exports = router;