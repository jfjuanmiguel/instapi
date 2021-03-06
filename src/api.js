const express = require("express");
const serverless = require("serverless-http");
const UserService = require("./Service/UserService");
const PostService = require("./Service/PostService");

const app = express();

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    endpoints: [
      "api/users/{username}",
      "api/users/id/{userid}",
      "api/users/{username}/profile",
      "api/users/{username}/posts",
      "api/posts/tag/{tag}"
    ]
  });
});

router.get("/users/:username", (req, res) => {
  const username = req.params.username;
  UserService.getUser(username)
    .then(user => {
      res.json(user);
    })
    .catch(error => {
      res.status(error.status).json(error);
    });
});

router.get("/users/id/:userid", (req, res) => {
  const userId = req.params.userid;
  UserService.getUserById(userId)
    .then(user => {
      res.json(user);
    })
    .catch(error => {
      res.status(error.status).json(error);
    });
});

router.get("/users/:username/profile", (req, res) => {
  const username = req.params.username;
  UserService.getProfile(username)
    .then(user => {
      res.json(user);
    })
    .catch(error => {
      res.status(error.status).json(error);
    });
});

router.get("/posts/tag/:tag", (req, res) => {
  const tag = req.params.tag;

  PostService.getPostsByTag(tag)
    .then(posts => {
      res.json(posts);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

router.get("/users/:username/posts", (req, res) => {
  const username = req.params.username;
  UserService.getUser(username)
    .then(user => {
      if (user.isPrivate) {
        res.status(401).json({
          message: "This account is private!",
          status: 401
        });
      } else {
        const first = req.query.first;
        const after = req.query.after;
        PostService.getUserPosts(user, first, after)
          .then(posts => {
            res.json(posts);
          })
          .catch(error => {
            res.status(error.status).json(error);
          });
      }
    })
    .catch(error => {
      res.status(error.status).json(error);
    });
});

app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app);
