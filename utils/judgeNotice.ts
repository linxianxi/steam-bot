const aiToken = process.env.AI_TOKEN;

// 判断更新是否有益
export async function judgeNotice(content: string) {
  try {
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
              content: `你是一个从事 cs2 游戏饰品倒卖的商人，低价买入高价卖出。
              你需要从游戏的更新公告中判断中是否有利益获取，例如以下几点是有利益获取的：
              1.箱子、收藏品、饰品、道具等即将下架、立即下架、最后获取机会等，可以马上购买大量这些绝版道具获利
              2.修复了某些饰品的外观问题，也可以马上购买。
              除去以上列出的这几点，你应该自行根据游戏更新公告判断是否有利益可以获取。下面是游戏更新公告内容：`,
            },
            {
              role: "user",
              content,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "judge_notice",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  result: { type: "boolean" },
                },
                required: ["result"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0,
        }),
      }
    );

    const response = await res.json();

    const result = JSON.parse(response.choices[0].message.content).result;

    // 输出结果
    console.log("判断更新结果", result);

    return result;
  } catch (err) {
    console.error("❌ 判断更新结果失败：", err);
    return true;
  }
}
