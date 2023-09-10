import { sendMail } from "../service/nodemailer.js";

const emailProcess = async (email) => {
  const data = await sendMail(email.data);
  console.log(data);
  return data;
};
export { emailProcess };
