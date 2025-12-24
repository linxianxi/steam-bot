import fs from "fs";

const zhBaseUrl =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/zh-CN";
const enBaseUrl =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en";

const suffixUrls = ["/collections.json"];

async function fetchJson(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`⚠️ 请求失败: ${url} → ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`⚠️ 拉取出错: ${url}`, err.message);
    return null;
  }
}

async function buildNameMap() {
  const result: Record<string, string> = {};

  for (const suffix of suffixUrls) {
    console.log(`📥 正在请求: ${suffix}`);

    const zhUrl = zhBaseUrl + suffix;
    const enUrl = enBaseUrl + suffix;

    // 顺序请求
    const zhData = await fetchJson(zhUrl);
    console.log(`${suffix} 中文请求结束`);
    const enData = await fetchJson(enUrl);
    console.log(`${suffix} 英文请求结束`);

    if (!Array.isArray(zhData) || !Array.isArray(enData)) {
      console.warn(`⚠️ 数据非法（不是数组）: ${suffix}`);
      continue;
    }

    const zhMap: Record<string, string> = {};
    for (const item of zhData) {
      zhMap[item.id] = item.name;
    }

    for (const item of enData) {
      const zhName = zhMap[item.id];
      if (zhName) {
        result[item.name] = zhName;
      }
    }
  }

  return result;
}

(async () => {
  try {
    const map = await buildNameMap();
    fs.writeFileSync(
      "./item-name-map.json",
      JSON.stringify(map, null, 2),
      "utf-8"
    );
    console.log("✅ 完成！item-name-map.json 已生成");
  } catch (err) {
    console.error("❌ 错误:", err);
  }
})();
