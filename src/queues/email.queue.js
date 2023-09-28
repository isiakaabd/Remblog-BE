// import bull from "bull";
// import { emailProcess } from "../pocesses/email.process.js";

// const redisOptons = process.env.REDIS_URL;
// const emailQueue = new bull("email", {
//   redis: redisOptons,
//   limiter: {
//     max: 10000,
//     duration: 5000,
//   },
// });

// emailQueue.process(emailProcess);

// const sendNewEmail = (data) => {
//   emailQueue.add(data, {
//     attempts: 5,
//   });
// };

// export { sendNewEmail, emailQueue };
