import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

let sha = "";

export async function getRemoteJSON(): Promise<
  { link: string; createTime: string }[]
> {
  try {
    const res = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "linxianxi",
        repo: "steam-bot",
        path: "sent.json",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    sha = res.data.sha;
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    return JSON.parse(content) || [];
  } catch (error) {
    console.error("获取 JSON 失败");
    return [];
  }
}

export async function addLink(content: string) {
  try {
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: "linxianxi",
      repo: "steam-bot",
      path: "sent.json",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
      sha,
      message: "Update sent.json",
      content: Buffer.from(content, "utf-8").toString("base64"),
    });
  } catch (error) {
    console.error("更新 JSON 失败");
  }
}
