const fetch = require("isomorphic-fetch");
const cookie = "ig_pr=2";

class PostService {
  static getPostsByTag = (tag, maxId = "") => {
    return new Promise((resolve, reject) => {
      fetch(
        `https://www.instagram.com/explore/tags/${tag}/?__a=1&max_id=${maxId}`,
        {
          headers: {
            Cookie: cookie
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
}

module.exports = PostService;
