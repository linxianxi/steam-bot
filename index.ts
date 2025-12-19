import puppeteer from "puppeteer";
import { callPhone, sendDingTalk, transformHtmlToMd } from "./utils";
import path from "path";
import fs from "fs";

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
  await page.browserContext().setCookie(
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

  // 2) 循环访问每个链接并保存 HTML
  let idx = 1;
  for (const link of links) {
    try {
      console.log(`\n➡️ 处理第 ${idx} 个链接：`, link);
      await page.goto(link, { waitUntil: "networkidle2" });

      // 等待 EventDetailsBody 出现（可选：根据页面）
      await page.waitForSelector(".EventDetailsBody", { timeout: 5000 });

      // 获取 outerHTML
      const { title, html } = await page.evaluate(() => {
        const titleEle = document.querySelector(".EventDetail");
        const bodyEl = document.querySelector(".EventDetailsBody");
        return {
          title:
            titleEle?.previousElementSibling?.children?.[1]?.textContent ||
            "通知",
          html: bodyEl ? bodyEl.outerHTML : "",
        };
      });

      if (!html) {
        console.warn("⚠️ 未找到更新内容");
        idx++;
        continue;
      }

      const exists = todayList.some((item) => item === link);
      if (!exists) {
        hasNews = true;
        const markdown = transformHtmlToMd(html);
        // 发送成功再添加 json
        await sendDingTalk({
          title,
          text: markdown,
          btns: [{ title: "查看详情", actionURL: link }],
        });
        todayList.push(link);
      }
    } catch (err: any) {
      console.error("❌ 链接处理失败：", err.message);
    }
    idx++;
  }

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
