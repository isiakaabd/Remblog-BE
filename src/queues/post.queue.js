import bull from "bull";
import { postsProcess } from "../pocesses/post.process.js";

const redisOptons = process.env.REDIS_URL;
// const postQueue = new bull("post", {
//   redis: redisOptons,
//   limiter: {
//     max: 10000,
//     duration: 5000,
//   },
// });

// postQueue.process(postsProcess);

export { postQueue };
