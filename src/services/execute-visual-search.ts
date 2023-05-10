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
  const browser = await chromium.launch();

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

  const rect = await page.locator("img.HqtXSc").boundingBox();
  if (!rect) return [];

  const sliders = await page.locator(".pklMG > input").all();
  for (const slider of sliders) {
    const label = await slider.getAttribute("aria-label");

    if (!label) continue;

    // top-left
    if (label.includes("top-left")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(rect.x, rect.y);
      await page.mouse.up();
    }

    // top-right
    if (label.includes("top-right")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width, rect.y);
      await page.mouse.up();
    }

    // bottom-left
    if (label.includes("bottom-left")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(rect.x, rect.y + rect.height);
      await page.mouse.up();
    }

    // bottom-right
    if (label.includes("bottom-right")) {
      const start = await slider.boundingBox();
      if (!start) continue;

      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width, rect.y + rect.height);
      await page.mouse.up();
    }
  }

  await page.getByText("Visual matches").waitFor({ state: "hidden" });

  // wait for text:visual matches to be visible
  await page.getByText("Visual matches").waitFor({ state: "visible" });

  // get all items
  const items = await page.locator(".G19kAf.ENn9pd").all();

  const records = [];
  for (const item of items) {
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
