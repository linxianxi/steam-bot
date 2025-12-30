import puppeteer from "puppeteer";
import { transformHtmlToMd } from "./utils/transformHtmlToMd";
import { sendDingTalk } from "./utils/sendDingTalk";
import { callPhone } from "./utils/callPhone";
import { translator } from "./utils/translator";
import { judgeNotice } from "./utils/judgeNotice";
import { addLink, getRemoteJSON } from "./utils/octokit";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "sent.json");

async function saveHTMLFiles() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let localSentData: { link: string; createTime: string }[] = [];
  try {
    localSentData = JSON.parse(fs.readFileSync(filePath, "utf8")) || [];
  } catch (error) {}

  // 是否打过电话
  let phoneCalled = false;

  async function main(count: number) {
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

    console.log(`➡️ 第 ${count} 次访问起始页面...`);
    await page.goto("https://steamcommunity.com/app/730/allnews", {
      waitUntil: "networkidle2",
    });

    // 1) 获取所有匹配日期的 link
    let links = await page.evaluate((localSentData) => {
      const cards = Array.from(document.querySelectorAll(".apphub_Card"));
      const urls: string[] = [];
      cards.forEach((card) => {
        const dateEl = card.querySelector(".apphub_CardContentNewsDate");
        if (dateEl?.textContent.includes("午")) {
          const url = card.getAttribute("data-modal-content-url");
          if (url && !localSentData.some((i) => i.link === url)) {
            urls.push(url);
          }
        }
      });
      return urls;
    }, localSentData);

    console.log("匹配到的链接数量：", links.length);

    if (links.length) {
      const remoteLinks = (await getRemoteJSON()).map((i) => i.link);
      // 过滤出不在 remoteLinks 中的 link
      links = links.filter((link) => !remoteLinks.includes(link));
      console.log("新链接数量：", links.length);
    }

    const shouldSaveLinks: string[] = [];

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

          newPage.close();

          if (!html) {
            console.warn("⚠️ 未找到更新内容");
            return;
          }
          const remoteData = await getRemoteJSON();

          // 再从最新的数据库中检查是否存在
          const exists = remoteData.some((i) => i.link === link);
          if (!exists) {
            const markdown = transformHtmlToMd(html);
            const shouldCallPhone = await judgeNotice(markdown);

            // 是否应该打电话，没打过再打
            if (shouldCallPhone && !phoneCalled) {
              phoneCalled = true;
              callPhone();
            }

            const content = await translator(markdown);

            await sendDingTalk({
              title,
              text: content,
              btns: [{ title: "查看详情", actionURL: link }],
            });

            shouldSaveLinks.push(link);
          }
        } catch (error) {
          console.error("❌ 链接处理失败：", error);
        }
      })
    );

    if (shouldSaveLinks.length) {
      const remoteData = await getRemoteJSON();
      const newLinkData = shouldSaveLinks.map((link) => ({
        link,
        createTime: new Date(
          // +8 小时
          Date.now() + 28800000
        ).toLocaleString(),
      }));
      await addLink(JSON.stringify([...newLinkData, ...remoteData], null, 2));
      localSentData.push(...newLinkData);
    }
  }

  const n = 10; // 执行次数
  for (let i = 0; i < n; i++) {
    try {
      await main(i + 1);
      console.log(`✅ 第 ${i + 1} 次 main 执行完成`);
    } catch (error) {
      console.error("❌ main 执行错误:", error);
    }

    if (i < n - 1) {
      // 间隔 5 秒
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }

  browser.close();
}

saveHTMLFiles()
  .then(() => {
    console.log("\n🚀 全部完成！");
  })
  .catch((err) => {
    console.error("❌ 脚本运行错误:", err);
  });
