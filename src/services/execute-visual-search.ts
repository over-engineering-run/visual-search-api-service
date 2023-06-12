import path from "path";
import { chromium } from "playwright";

interface VisualMatchRecord {
  position: number;
  link: string;
  title: string;
  thumbnail: string;
  source: string;
}

type Props = {
  url: string;
};

const baseDir = "public/videos";

async function executeVisualSearch(props: Props): Promise<VisualMatchRecord[]> {
  console.log("Opening browser");
  const browser = await chromium.launch({
    headless: process.env.NODE_ENV === "production",
    args: [
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    recordVideo: { dir: baseDir },
  });

  try {
    console.log("Opening page");
    const page = await context.newPage();

    const video = page.video();
    if (video) {
      const url = new URL(props.url);
      const { dir, name } = path.parse(path.join(baseDir, url.pathname));
      video.saveAs(path.format({ dir, name, ext: ".webm" }));
      video.delete();
    }

    console.log("Going to google");
    await page.goto("https://www.google.com");

    console.log("Clicking search by image button");
    await page.getByRole("button", { name: "Search by image" }).click();

    console.log("Uploading image");
    await page
      .getByRole("textbox", { name: "Paste image link" })
      .fill(props.url);
    await page
      .getByRole("textbox", { name: "Paste image link" })
      .press("Enter");

    console.log('Waiting for "Visual matches" load');
    await page.getByText("Visual matches").waitFor({ state: "visible" });

    await page.waitForLoadState("load");

    console.log("Getting all items");
    const records: VisualMatchRecord[] = [];
    const items = await page.locator(".G19kAf.ENn9pd").all();
    for (const item of items) {
      await item.waitFor({ state: "visible" });

      await item.scrollIntoViewIfNeeded();

      const link = await item.getByRole("link").getAttribute("href");
      const title = await item.locator(".UAiK1e").textContent();
      const thumbnail = await item.locator(".wETe9b.jFVN1").getAttribute("src");
      const source = await item.locator(".fjbPGe").textContent();

      if (!link || !title || !thumbnail || !source) continue;

      records.push({
        position: items.indexOf(item),
        link,
        title,
        thumbnail,
        source,
      });
    }
    return records;
  } catch (e) {
    console.error(e);
    return [];
  } finally {
    console.log("Closing browser");
    await context.close();
    await browser.close();
  }
}
export default executeVisualSearch;
