import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { transformHtmlToMd } from "./utils/transformHtmlToMd";
import { sendDingTalk } from "./utils/sendDingTalk";
import { callPhone } from "./utils/callPhone";
import { translator } from "./utils/translator";

async function saveHTMLFiles() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // 设置时区偏移 cookie
  await browser.setCookie(
    {
      name: "timezoneOffset",
      value: "28800,0", // 示例值
      domain: "steamcommunity.com",
      path: "/",
    },
    {
      name: "Steam_Language",
      value: "schinese",
      domain: "steamcommunity.com",
      path: "/",
    }
  );

  console.log("➡️ 访问起始页面...");
  await page.goto("https://steamcommunity.com/app/730/allnews", {
    waitUntil: "networkidle2",
  });

  const nowBeijing = new Date(new Date().getTime() + 8 * 3600 * 1000);
  const year = nowBeijing.getFullYear();
  const month = nowBeijing.getMonth() + 1;
  const day = nowBeijing.getDate();
  const targetDate = `${year}-${month}-${day}`;

  console.log("日期", targetDate);

  // 1) 获取所有匹配日期的 link
  const links = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".apphub_Card"));
    const urls: string[] = [];
    cards.forEach((card) => {
      const dateEl = card.querySelector(".apphub_CardContentNewsDate");
      console.log("dateEl", dateEl?.textContent);
      if (dateEl && dateEl.textContent.includes("午")) {
        const url = card.getAttribute("data-modal-content-url");
        if (url) urls.push(url);
      }
    });
    return urls;
  });

  console.log("匹配到的链接数量：", links.length);

  const jsonPath = path.join(process.cwd(), "sent.json");

  // 读取旧记录
  let sentData: Record<string, string[]> = {};
  if (fs.existsSync(jsonPath)) {
    try {
      sentData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch {
      sentData = {};
    }
  }

  // 获取今天记录数组
  const todayList = sentData[targetDate] ?? [];
  // 是否有新闻
  let hasNews = false;

  await Promise.all(
    links.map(async (link, index) => {
      try {
        console.log(`\n➡️ 处理第 ${index} 个链接：`, link);

        const newPage = await browser.newPage();
        await newPage.goto(link, { waitUntil: "networkidle2" });
        await newPage.waitForSelector(".EventDetailsBody", { timeout: 5000 });

        const { title, html } = await newPage.evaluate(() => {
          const titleEle = document.querySelector(".EventDetail");
          const bodyEl = document.querySelector(".EventDetailsBody");
          return {
            title:
              titleEle?.previousElementSibling?.children?.[1]?.textContent ||
              "通知",
            html: bodyEl ? bodyEl.outerHTML : "",
          };
        });

        await newPage.close();

        if (!html) {
          console.warn("⚠️ 未找到更新内容");
          return;
        }

        const exists = todayList.some((item) => item === link);
        if (!exists) {
          hasNews = true;
          const markdown = transformHtmlToMd(html);
          const content = await translator(markdown);

          await sendDingTalk({
            title,
            text: content,
            btns: [{ title: "查看详情", actionURL: link }],
          });

          todayList.push(link);
        }
      } catch (err: any) {
        console.error("❌ 链接处理失败：", err.message);
      }
    })
  );

  browser.close();

  // 如果有新闻，打电话，设置 json
  if (hasNews) {
    callPhone();
    sentData[targetDate] = todayList;
    fs.writeFileSync(jsonPath, JSON.stringify(sentData, null, 2), "utf-8");
    console.log("📌 sent.json 已更新：", jsonPath);
  } else {
    console.log("⚠️ 未找到新的更新");
  }
}

saveHTMLFiles()
  .then(() => console.log("\n🚀 全部完成！"))
  .catch((err) => console.error("❌ 脚本运行错误:", err));
