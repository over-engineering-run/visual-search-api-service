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

async function executeVisualSearch(props: Props): Promise<VisualMatchRecord[]> {
  // open browser
  const browser = await chromium.launch({
    headless: process.env.NODE_ENV === "production",
    args: [
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  // open new tab
  const page = await browser.newPage();

  // go to google
  await page.goto("https://www.google.com");

  // click search by image button
  await page.getByRole("button", { name: "Search by image" }).click();

  // click upload an image button and upload image
  await page.getByRole("textbox", { name: "Paste image link" }).fill(props.url);
  await page.getByRole("textbox", { name: "Paste image link" }).press("Enter");

  // wait for text:visual matches to be visible
  await page.getByText("Visual matches").waitFor({ state: "visible" });
  await page.screenshot({ path: "debug/screenshot-1.png" });

  const rect = await page.locator("img.HqtXSc").boundingBox();
  if (!rect) return [];

  // click center of image
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.screenshot({ path: "debug/screenshot-2.png" });

  await page.getByText("Visual matches").waitFor({ state: "visible" });
  await page.screenshot({ path: "debug/screenshot-3.png" });

  const sliders = await page.locator(".pklMG input").all();
  const offset = 20;
  for (const slider of sliders) {
    const label = await slider.getAttribute("aria-label");
    if (!label) continue;

    // top-left
    if (label.includes("top-left")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();

      await page.mouse.move(rect.x - offset, rect.y - offset);
      await page.mouse.up();
      await page.screenshot({ path: "debug/screenshot-4.png" });
    }

    // bottom-right
    if (label.includes("bottom-right")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(
        rect.x + rect.width + offset,
        rect.y + rect.height + offset
      );
      await page.mouse.up();
      await page.screenshot({ path: "debug/screenshot-5.png" });
    }
  }
  await page.screenshot({ path: "debug/screenshot-6.png" });

  await page.waitForResponse((res) => res.url().includes("batchexecute"));
  await page.screenshot({ path: "debug/screenshot-7.png" });

  await page.getByText("Visual matches").waitFor({ state: "visible" });
  await page.screenshot({ path: "debug/screenshot-8.png" });

  // get all items
  const items = await page.locator(".G19kAf.ENn9pd").all();

  const records = [];
  for (const item of items) {
    await item.waitFor({ state: "visible" });
    // scroll to item
    await item.scrollIntoViewIfNeeded();

    const link = await item.getByRole("link").getAttribute("href");
    const title = await item.locator(".UAiK1e").textContent();
    const thumbnail = await item.locator(".wETe9b.jFVN1").getAttribute("src");
    const source = await item.locator(".fjbPGe").textContent();

    // if any of them is missing, skip
    if (!link || !title || !thumbnail || !source) continue;

    // add to records
    records.push({
      position: items.indexOf(item),
      link,
      title,
      thumbnail,
      source,
    });
  }

  await browser.close();

  return records;
}
export default executeVisualSearch;
