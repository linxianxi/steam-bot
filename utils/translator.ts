const aiToken = process.env.AI_TOKEN;
const translatorPrompt = process.env.TRANSLATOR_PROMPT;

export async function translator(content: string) {
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
              content: translatorPrompt,
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

    return response.choices[0].message.content;
  } catch (err) {
    console.error("API 调用出错:", err);
    return content;
  }
}
