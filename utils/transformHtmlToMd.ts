import TurndownService from "turndown";

export function transformHtmlToMd(htmlFragment: string) {
  const turndownService = new TurndownService();
  const md = turndownService.turndown(htmlFragment);
  return md;
}
