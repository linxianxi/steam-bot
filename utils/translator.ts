import fs from "fs";

const aiToken = process.env.AI_TOKEN;

export async function translator(content: string) {
  try {
    const itemNameMapJSON = fs.readFileSync("./item-name-map.json", "utf-8");
    const res = await fetch(
      "https://api.chatanywhere.tech/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiToken}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: `你是一个专业的 cs2 游戏内容翻译，可以将发给你的游戏更新公告翻译成中文。
              提到的所有物品及 cs2 游戏相关专业名词术语等都必须使用官方的中文翻译。
              物品名称的中文翻译可以从这里获取： ${itemNameMapJSON}。
              如果发给你的内容是中文，你直接返回中文，如果是英文必须按照我的要求的翻译成中文，且必须保持其它 markdown 符号不变。
              下面是我需要翻译的内容：`,
            },
            {
              role: "user",
              content,
            },
          ],
          temperature: 0,
        }),
      }
    );

    const response = await res.json();
    const result = response.choices[0].message.content;
    console.log("API 调用响应:", result);
    return result;
  } catch (err) {
    console.error("API 调用出错:", err);
    return content;
  }
}
