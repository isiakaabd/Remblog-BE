import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { welcomeMessage } from "../../utils/email-templates/welcome.js";

dotenv.config();

export const sendMail = async ({ recipient, username }) => {
  let data = null;
  const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.USERNAME_ACC,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: "noreply@remblog.app",
    to: recipient,
    subject: "Welcome To REMBLOG!!",
    html: welcomeMessage(username),
  };

  try {
    data = await transport.sendMail(mailOptions);
    return data;
  } catch (error) {
    data = error.message;
  }
  transport.close();
  return data;
};
