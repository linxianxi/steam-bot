const aiToken = process.env.AI_TOKEN;
const judgeNoticePrompt = process.env.JUDGE_NOTICE_PROMPT;

// 判断更新是否有益或有害
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
              content: judgeNoticePrompt,
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
