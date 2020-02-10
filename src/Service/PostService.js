const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 8.1.0; motorola one Build/OPKS28.63-18-3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.80 Mobile Safari/537.36 Instagram 72.0.0.21.98 Android (27/8.1.0; 320dpi; 720x1362; motorola; motorola one; deen_sprout; qcom; pt_BR; 132081645";
const SESSION_ID = "ig_pr=2";
const fetch = require("isomorphic-fetch");
const request = require("request");

class PostService {
  static getPostsByTag = (tag, maxId = "") => {
    return new Promise((resolve, reject) => {
      fetch(
        `https://www.instagram.com/explore/tags/${tag}/?__a=1&max_id=${maxId}`,
        {
          headers: {
            Cookie: SESSION_ID
          }
        }
      )
        .then(res => {
          console.log(res);
          return res.json();
        })
        .then(({ graphql }) => {
          const hashtag = graphql.hashtag;
          const posts = hashtag.edge_hashtag_to_media.edges.map(item => {
            const node = item.node;
            return {
              owner: node.owner.id,
              id: node.id,
              isVideo: node.is_video,
              caption: node.edge_media_to_caption.edges[0].node.text,
              shortCode: node.shortcode,
              likeCount: node.edge_liked_by.count,
              commentCount: node.edge_media_to_comment.count,
              postDate: node.taken_at_timestamp,
              displayUrl: node.display_url
            };
          });
          const tag = {
            info: {
              id: hashtag.id,
              name: hashtag.name,
              profilePicUrl: hashtag.profile_pic_url,
              mediaCount: hashtag.edge_hashtag_to_media.count
            },
            posts
          };
          resolve(tag);
        })
        .catch(error => reject(error));
    });
  };

  static getUserPosts(user, first = 20, after = null) {
    return new Promise((resolve, reject) => {
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Cookie: `sessionid=${SESSION_ID};`
      };
      const options = {
        url: `https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables={"id":"${user.id}","first":"${first}","after":${after}}`,
        method: "GET",
        headers: headers
      };
      request(options, (error, response, body) => {
        let data = JSON.parse(body);
        if (data.message) {
          reject({
            message: data.message,
            status: 500
          });
          return;
        }
        data = data.data.user.edge_owner_to_timeline_media;
        if (data.count > 0) {
          const posts = {
            owner: {
              id: user.id,
              username: user.username,
              pictureUrl: user.pictureUrl
            },
            pageInfo: {
              hasNextPage: data.page_info.has_next_page,
              endCursor: data.page_info.end_cursor
            },
            posts: []
          };
          data.edges.map(({ node }) => {
            const caption =
              node.edge_media_to_caption.edges.length > 0 &&
              node.edge_media_to_caption.edges[0].node.text;
            posts.posts.push({
              type: node.is_video ? "video" : "image",
              dimensions: node.dimensions,
              displayUrl: node.display_url,
              publishingDate: node.taken_at_timestamp,
              videoUrl: node.video_url && node.video_url,
              caption: caption ? caption : null,
              publishingDate: node.taken_at_timestamp,
              location: node.location && node.location.name,
              preview: node.is_video
                ? node.edge_media_preview_like.count
                : null,
              like: !node.is_video ? node.edge_media_preview_like.count : null,
              comment: !node.is_video ? node.edge_media_to_comment.count : null
            });
          });
          resolve(posts);
        } else {
          reject({
            message: "Post not found!",
            status: 404
          });
        }
      });
    });
  }
}

module.exports = PostService;
