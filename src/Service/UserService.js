const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 8.1.0; motorola one Build/OPKS28.63-18-3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.80 Mobile Safari/537.36 Instagram 72.0.0.21.98 Android (27/8.1.0; 320dpi; 720x1362; motorola; motorola one; deen_sprout; qcom; pt_BR; 132081645";
const SESSION_ID = "ig_pr=2";
const request = require("request");
const cheerio = require("cheerio");

class UserService {
  static getUser = username => {
    return new Promise((resolve, reject) => {
      request(
        `https://www.instagram.com/web/search/topsearch/?context=user&count=0&query=${username}`,
        (error, response, body) => {
          let user = JSON.parse(body);
          user = user.users[0];

          if (user) {
            resolve({
              id: user.user.pk,
              username: user.user.username,
              fullName: user.user.full_name,
              isPrivate: user.user.is_private,
              pictureUrl: user.user.profile_pic_url,
              isVerified: user.user.is_verified
            });
          } else {
            reject({
              message: "User not found!",
              status: 404
            });
          }
        }
      );
    });
  };

  static getProfile = username =>
    new Promise(function(resolve, reject) {
      request(`http://www.instagram.com/` + username, function(
        err,
        resp,
        html
      ) {
        if (!err) {
          if (resp.statusCode == 200) {
            const $ = cheerio.load(html);
            $("body")
              .children()
              .each((i, e) => {
                const eleHTML = $(e).html();
                if (eleHTML.indexOf("window._sharedData") > -1) {
                  const data = JSON.parse(
                    eleHTML
                      .split('"ProfilePage":[')[1]
                      .split(']},"hostname"')[0]
                  ).graphql.user;

                  if (data) {
                    const user = {
                      id: data.id,
                      username: data.username,
                      fullName: data.full_name,
                      isPrivate: data.is_private,
                      isVerified: data.is_verified,
                      category: data.category,
                      mediaCount: data.edge_owner_to_timeline_media.count,
                      followerCount: data.edge_followed_by.count,
                      followingCount: data.edge_follow.count,
                      biography: data.biography,
                      pictureUrl: data.profile_pic_url,
                      pictureUrlHd: data.profile_pic_url_hd,
                      externalUrl: data.external_url
                    };
                    resolve(user);
                    return false;
                  } else {
                    reject({
                      message: "User not found!",
                      status: 404
                    });
                  }
                }
              });
          } else reject(resp.statusCode);
        } else reject(err);
      });
    });

  static getUserById(userId) {
    return new Promise((resolve, reject) => {
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Cookie: `sessionid=${SESSION_ID};`
      };
      const options = {
        url: `https://i.instagram.com/api/v1/users/${userId}/info/`,
        method: "GET",
        headers: headers
      };
      request(options, (error, response, body) => {
        let user = JSON.parse(body);

        if (user) {
          resolve({
            id: user.user.pk,
            username: user.user.username,
            pictureUrl: user.user.profile_pic_url
          });
        } else {
          reject({
            message: "User not found!",
            status: 404
          });
        }
      });
    });
  }
}

module.exports = UserService;
