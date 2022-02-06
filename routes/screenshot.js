const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const cloudinary = require("cloudinary").v2;

const parseUrl = function (url) {
  url = decodeURIComponent(url);
  if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
    url = "http://" + url;
  }

  return url;
};

const Pixel3 = puppeteer.devices["Pixel 3"];

router.get("/", async function (req, res, next) {
  const URL = parseUrl(req.query.url);
  console.log(URL);
  try {
    // mobile
    const browserMobile = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const pageMobile = await browserMobile.newPage();
    await pageMobile.emulate(Pixel3);
    await pageMobile.goto(URL);
    await pageMobile.waitFor(500);
    const imageMobile = await pageMobile.screenshot({ type: "jpeg" });
    await browserMobile.close();

    // desktop
    const browserDesktop = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const pageDesktop = await browserDesktop.newPage();
    await pageDesktop.setViewport({
      width: 1920,
      height: 1080,
    });
    await pageDesktop.goto(URL);
    await pageDesktop.waitFor(1000);
    const imageDesktop = await pageDesktop.screenshot({ type: "jpeg" });

    // cloudinary
    const uploadStr = "data:image/jpg;base64," + imageMobile.toString("base64");
    const mobileUploaded = await cloudinary.uploader.upload(uploadStr, {
      tags: "mobile",
      folder: "screenshots",
    });
    const uploadStr2 =
      "data:image/jpg;base64," + imageDesktop.toString("base64");
    const desktopUploaded = await cloudinary.uploader.upload(uploadStr2, {
      tags: "desktop",
      folder: "screenshots",
    });

    res.send({
      mobile: mobileUploaded.secure_url,
      desktop: desktopUploaded.secure_url,
    });
  } catch (error) {
    console.log(error);
    res.send({ error: error });
  }
});

module.exports = router;
