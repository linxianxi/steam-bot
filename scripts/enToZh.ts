import fs from "fs";

const zhUrl =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/zh-CN/all.json";
// 英文 JSON 路径
const enUrl =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/all.json";

async function buildEnToZh() {
  try {
    // 拉取中文/英文 JSON
    const enResp = await fetch(enUrl);
    const zhResp = await fetch(zhUrl);

    if (!enResp.ok || !zhResp.ok) {
      throw new Error("拉取 JSON 失败，请检查网络连通性");
    }

    const enJson = await enResp.json();
    const zhJson = await zhResp.json();

    // 生成 {英文名: 中文名} 对照表
    const enToZh: Record<string, string> = {};

    for (const id of Object.keys(enJson)) {
      const enItem = enJson[id];
      const zhItem = zhJson[id];

      // 如果这个 id 在中文里存在
      if (enItem?.name && zhItem?.name) {
        enToZh[enItem.name] = zhItem.name;
      }
    }

    // 保存到本地文件
    const outPath = "./en-to-zh.json";
    fs.writeFileSync(outPath, JSON.stringify(enToZh, null, 2), "utf-8");

    console.log(`生成成功！总计 ${Object.keys(enToZh).length} 条记录`);
  } catch (err) {
    console.error("失败：", err);
  }
}

buildEnToZh();
