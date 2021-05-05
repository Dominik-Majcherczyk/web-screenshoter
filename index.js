const webshot = require("node-webshot");
const nodemailer = require("nodemailer");
const AdmZip = require("adm-zip");
const fs = require("fs");

//paths to the folders with screenshots and zip files
const shotsDir = "./screenshots/";
const zipDir = "./zip_files/";

const resolutions = {
  large: {
    width: 1920,
    height: 1080,
  },
  medium: {
    width: 768,
    height: 1024,
  },
  small: {
    width: 320,
    height: 480,
  },
};

const setNodemailerData = (email, password, receiverEmail, attachments) => {
  return (nodemailerData = {
    userEmail: {
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    },
    mailOptions: {
      from: email,
      to: receiverEmail,
      subject: `${attachments[0].filename} screenshots`,
      attachments,
    },
  });
};

const setOptions = (screenSize) => {
  return {
    screenSize,
    shotSize: {
      width: "window",
      //change line below to  height: "all" if you don't want to trim the page to the specified height
      height: "window",
    },
    userAgent:
      "Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)" +
      " AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g",
  };
};

const extractName = (url) => {
  const domain = new URL(url).hostname.replace("www.", "");
  return domain;
};

const setPathToFile = (url, mediaSize) => {
  const path = `${shotsDir}${extractName(url)}-${mediaSize.width}x${
    mediaSize.height
  }.jpg`;
  return path;
};

const makeWebshot = (url, mediaSize) =>
  new Promise((resolve, reject) => {
    webshot(
      url,
      setPathToFile(url, mediaSize),
      setOptions(mediaSize),
      (err) => {
        if (err) return reject(err);
        console.log("screenshot taken!");
        return resolve();
      }
    );
  });

const takeScreenshots = (url) => {
  const resolutionsArray = Object.values(resolutions);
  return Promise.all(
    resolutionsArray.map((mediaSize) => makeWebshot(url, mediaSize))
  );
};

const deleteFile = (file) => {
  try {
    fs.unlinkSync(`${shotsDir}${file}`);
    console.log(`${file} removed`);
  } catch (err) {
    console.error(err);
  }
};

const addFile = (file, zip) => {
  try {
    zip.addLocalFile(`${shotsDir}${file}`);
    console.log(`${file} added`);
    //comment out the function below to not delete files after adding to zip
    deleteFile(file);
  } catch (err) {
    console.error(err);
  }
};

const makeZip = (url) => {
  const zip = new AdmZip();
  fs.mkdirSync(zipDir, { recursive: true });
  fs.readdirSync(`${shotsDir}`).map((file) => addFile(file, zip));
  zip.writeZip(`${zipDir}${extractName(url)}.zip`);
  console.log(`zip ${extractName(url)} maked!`);
};

const setAttachments = (url) => {
  const fileName = extractName(url);
  return (attachments = [
    {
      filename: `${fileName}.zip`,
      path: `${zipDir}${fileName}.zip`,
    },
  ]);
};

const sendEmail = (url, email, password, receiverEmail) => {
  const attachments = setAttachments(url);

  const nodemailerData = setNodemailerData(
    email,
    password,
    receiverEmail,
    attachments
  );
  const mail = nodemailer.createTransport(nodemailerData.userEmail);
  return new Promise((resolve, reject) => {
    mail.sendMail(nodemailerData.mailOptions, (err, info) => {
      if (err) return reject(err);
      console.log("Email sent: " + info.response);
      return resolve("Email sent: " + info.response);
    });
  });
};

module.exports = { takeScreenshots, makeZip, sendEmail };
