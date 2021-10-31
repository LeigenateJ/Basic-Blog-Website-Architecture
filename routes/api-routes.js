const {v4: uuid} = require("uuid"); 
const userDao = require("../modules/user-dao.js");
const express = require("express");
const apiRouter = express.Router();
// function apiRouter(router) {
//api
apiRouter.post("/api/login", async function (req, res) {
  const username = req.body.username;
  let msg;
  let temp_user = await userDao.retrieveUserByUsername(username);
  if (temp_user == undefined) {
    msg = 'Undefined username!';
    res.status(401).json(msg);
  } else {
    temp_user.password = req.body.password;
    temp_user = await userDao.saltingUserPassword(temp_user);
    const password_salting = temp_user.password_salting;
    const user = await userDao.retrieveUserWithCredentials(username, password_salting); // if there is a matching user...

    if (user) {
      const authToken = uuid();
      msg = 'Login success!';
      res.cookie("authToken", authToken);
      res.cookie("userId", user.user_id);
      res.status(204).json(msg);
    } // Otherwise, if there's no matching user...
    else {
      // Auth fail
      msg = 'Password error!';
      res.status(401).json(msg);
    }
  }
});

apiRouter.get("/api/logout", async function (req, res) {
  let msg;
  if (req.cookies.authToken) {
    msg = 'Logout success!';
    res.clearCookie("authToken");
    res.clearCookie("userId");
    res.status(204).json(msg);
  } else {
    msg = 'Error!'
    res.status(401).json(msg);
  }
});

apiRouter.get("/api/users", async function (req, res) {
  let msg;
  if (req.cookies.authToken) {
    let result = await userDao.isAdmin(req.cookies.userId);
    if (result) {
      let user_list = await userDao.findUserList()
      res.json(user_list);
    } else {
      msg = 'You are not an admin!'
      res.status(401).json(msg);
    }
  } else {
    msg = 'Unauthenticated!';
    res.status(401).json(msg);
  }
});
apiRouter.delete("/api/users/:id", async function (req, res) {
  let msg;
  if (req.cookies.authToken) {
    let result = await userDao.isAdmin(req.cookies.userId);
    if (result) {
      msg = 'Delete success!'
      await userDao.deleteUserThingByID(req.params.id);
      res.status(204).json(msg);
    } else {
      msg = 'You are not an admin!'
      res.status(401).json(msg);
    }
  } else {
    msg = 'Unauthenticated!';
    res.status(401).json(msg);
  }
});



//}

module.exports = apiRouter;
