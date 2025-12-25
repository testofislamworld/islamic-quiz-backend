const nodemailer = require("nodemailer");
const pug = require("pug");

const tryCatch = require("./tryCatch");
const {User} = require("../modal/User");

const transporter = nodemailer.createTransport({
  // host: "gmail.googleapis.com",
  // // service: "gmail.com",
  // port: 465,
  // secure: true,
  // secureConnection: true,
  // requireTLS: true,
  service: "gmail",
  auth: {
    user: "seositesoft17@gmail.com",
    pass: "ctcvmeedcwjfqxad",
  },
  // from: process.env.EMAIL,
  // vjskowqzcienncue
  // ealdogeboaohzeaa
});

exports.emailVerification = tryCatch(async (params) => {
  const html = pug.renderFile(`${__dirname}/../views/passwordReset.pug`, {
    code: params.verification_code,
    name: params.user.name,
    image: `https://res.cloudinary.com/dr6vcennd/image/upload/v1744202488/Screenshot_2025-04-09_at_5.41.09_PM_ueiczu.png`,
  });
  transporter.sendMail(
    {
      from: `Islam Test < ${process.env.EMAIL}>`,
      to: params.user.email,
      subject: "Forget Password",
      html: html,
    },
    async (emailError, emailInfo) => {
      if (!emailError) {
        await User.updateOne(
          { email: params.user.email },
          {
            verification_code: params.verification_code,
          },
          { new: true }
        );
        return params.res.status(200).json({
          success: true,
          message: "Please check your email for Password Verify Code",
        });
      } else {
        return params.res.status(400).json({
          success: false,
          message: "Something Wrong Please resend verification code",
          error: {
            emailError,
          },
        });
      }
    }
  );
});
