import TurndownService from "turndown";
import crypto from "crypto";

export function transformHtmlToMd(htmlFragment: string) {
  const turndownService = new TurndownService();
  const md = turndownService.turndown(htmlFragment);
  return md;
}

const baseWebhookUrl =
  "https://oapi.dingtalk.com/robot/send?access_token=00b8cd40bcd57683725f65b6fe260346537b9f5a8c1b163634ad8fcc36743725";

// 你在钉钉机器人设置中获得的 Secret Key
const secret =
  "SEC144f8c71b8f39e09bc7b6c6267766577f86c182f81a4075c2d803e509c9c38c8";

function makeSignature(secret: string) {
  const timestamp = Date.now().toString(); // 毫秒级时间戳
  const stringToSign = `${timestamp}\n${secret}`;

  // 用 HMAC-SHA256 对字符串进行签名
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(stringToSign);

  // 先 Base64，再 URL Encode
  const sign = encodeURIComponent(hmac.digest("base64"));

  return { timestamp, sign };
}

export async function sendDingTalk(msgContent: string) {
  try {
    // 生成签名
    const { timestamp, sign } = makeSignature(secret);

    // 构造最终带签名的 URL
    const webhookUrl = `${baseWebhookUrl}&timestamp=${timestamp}&sign=${sign}`;

    const body = {
      msgtype: "text",
      text: { content: msgContent },
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    console.log("钉钉返回：", data);
  } catch (err) {
    console.error("发送失败：", err);
  }
}
