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
                      pictureUrlHd: data.profile_pic_url_hd
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
}

module.exports = UserService;
