const aiToken = process.env.AI_TOKEN;

async function runExample() {
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
              content:
                "你是一个 cs2 游戏专业翻译，要求所有游戏术语和游戏物品、饰品、箱子必须使用 CS2 内置简体中文名称，包括箱子名、收藏品名、贴纸、系列等。后面将会发给你 markdown 格式的内容，如果里面的内容的是中文，原封不动的返回给我。如果里面的内容是英文，请翻译成中文，保持里面其他符号不变。",
            },
            {
              role: "user",
              content:
                "[ MISC ] Fixed an issue that would allow exec_async to continue executing in cheat protected servers resulting in random user input dropout. Last chance to pick up the Gallery Case, Graphic Collection, and Character Craft stickers from The Armory.",
            },
          ],
          // messages: [
          //   {
          //     role: "system",
          //     content:
          //       "你是一个 cs2 专业倒卖饰品的商人，高卖低买，你需要通过游戏更新通知某个饰品、箱子、收藏品等等下架，你需要帮我是否有利益可以获得。下面将会发送游戏的更新通知，帮我分析是否有利益可以获得。",
          //   },
          //   {
          //     role: "user",
          //     content:
          //       "[ MISC ] Fixed an issue that would allow exec_async to continue executing in cheat protected servers resulting in random user input dropout. Last chance to pick up the Gallery Case, Graphic Collection, and Character Craft stickers from The Armory.",
          //   },
          // ],
          // messages: [
          //   {
          //     role: "system",
          //     content:
          //       "你是一个 cs2 专业倒卖饰品的商人，高卖低买，你需要通过游戏更新通知某个饰品、箱子、收藏品等等下架，你需要帮我是否有利益可以获得。下面将会发送游戏的更新通知，帮我分析是否有利益可以获得",
          //   },
          //   {
          //     role: "user",
          //     content:
          //       "Last chance to pick up the Gallery Case, Graphic Collection, and Character Craft stickers from The Armory.",
          //   },
          // ],
          // response_format: {
          //   type: "json_schema",
          //   json_schema: {
          //     name: "keyword_check",
          //     strict: true,
          //     schema: {
          //       type: "object",
          //       properties: {
          //         containsKeyword: { type: "boolean" },
          //       },
          //       required: ["containsKeyword"],
          //       additionalProperties: false,
          //     },
          //   },
          // },
          temperature: 0,
        }),
      }
    );

    const response = await res.json();

    // 输出结果
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("API 调用出错:", err);
  }
}

runExample();
