import TurndownService from "turndown";
import crypto from "crypto";

export function transformHtmlToMd(htmlFragment: string) {
  const turndownService = new TurndownService();
  const md = turndownService.turndown(htmlFragment);
  return md;
}

const baseWebhookUrl = process.env.DINGTALK_WEBHOOK_URL!;

const secret = process.env.DINGTALK_SECRET!;

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

export async function sendDingTalk(content: {
  title: string;
  text: string;
  btns: {
    title: string;
    actionURL: string;
  }[];
}) {
  // 生成签名
  const { timestamp, sign } = makeSignature(secret);

  // 构造最终带签名的 URL
  const webhookUrl = `${baseWebhookUrl}&timestamp=${timestamp}&sign=${sign}`;

  const body = {
    msgtype: "actionCard",
    actionCard: content,
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await res.json();
  console.log("钉钉发送成功", response);
}

const pushPhoneUrl = process.env.PUSH_PHONE_URL!;
const phoneToken = process.env.PHONE;

export function callPhone() {
  console.log("📞 调用电话");
  fetch(`${pushPhoneUrl}?message=cs更新通知&targets=${phoneToken}`);
}
