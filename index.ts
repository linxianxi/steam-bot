import puppeteer from "puppeteer";
import { sendDingTalk, transformHtmlToMd } from "./utils";

async function saveHTMLFiles() {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // 设置 HTTP Accept-Language 请求头为中文
  await page.setExtraHTTPHeaders({
    "Accept-Language": "zh-CN,zh;q=0.9",
  });

  // 设置时区偏移 cookie
  await page.browserContext().setCookie({
    name: "timezoneOffset",
    value: "28800,0", // 示例值
    domain: "steamcommunity.com",
    path: "/",
  });

  console.log("➡️ 访问起始页面...");
  await page.goto("https://steamcommunity.com/app/730/allnews/", {
    waitUntil: "networkidle2",
  });

  // const nowBeijing = new Date(new Date().getTime() + 8 * 3600 * 1000);
  // const month = nowBeijing.getMonth() + 1;
  // const day = nowBeijing.getDate();
  const targetDate = `12 月 9 日`;

  // 1) 获取所有匹配日期的 link
  const links = await page.evaluate((dateText) => {
    const cards = Array.from(document.querySelectorAll(".apphub_Card"));
    const urls: string[] = [];
    cards.forEach((card) => {
      const dateEl = card.querySelector(".apphub_CardContentNewsDate");
      console.log("dateEl", dateEl?.textContent);
      // console.log(" dateEl.textContent", dateEl.textContent.trim());
      if (dateEl && dateEl.textContent.trim() === dateText) {
        const url = card.getAttribute("data-modal-content-url");
        if (url) urls.push(url);
      }
    });
    return urls;
  }, targetDate);

  console.log("匹配到的链接数量：", links.length);

  // 2) 循环访问每个链接并保存 HTML
  let idx = 1;
  for (const link of links) {
    try {
      console.log(`\n➡️ 处理第 ${idx} 个链接：`, link);
      await page.goto(link, { waitUntil: "networkidle2" });

      // 等待 EventDetailsBody 出现（可选：根据页面）
      await page.waitForSelector(".EventDetailsBody", { timeout: 5000 });

      // 获取 outerHTML
      const htmlFragment = await page.evaluate(() => {
        const el = document.querySelector(".EventDetailsBody");
        return el ? el.outerHTML : "";
      });

      if (!htmlFragment) {
        console.warn("⚠️ 未找到 .EventDetailsBody");
        idx++;
        continue;
      }

      const md = transformHtmlToMd(htmlFragment);
      sendDingTalk(md);
    } catch (err: any) {
      console.error("❌ 链接处理失败：", err.message);
    }
    idx++;
  }

  await browser.close();
}

saveHTMLFiles()
  .then(() => console.log("\n🚀 全部完成！"))
  .catch((err) => console.error("❌ 脚本运行错误:", err));
