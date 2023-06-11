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
      video.saveAs(`${baseDir}/${props.url}-${Date.now()}.webm`);
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

    console.log("Waiting for image to be visible");
    await page.locator(".bn6k9b").waitFor({ state: "visible" });

    const rect = await page.locator("img.HqtXSc").boundingBox();
    if (!rect) return [];

    // click center of image
    console.log("Clicking center of image");
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    console.log('Waiting for "Visual matches" reload');
    await page.getByText("Visual matches").waitFor({ state: "hidden" });
    await page.getByText("Visual matches").waitFor({ state: "visible" });

    const sliders = await page.locator(".pklMG input").all();
    console.log("Adjusting sliders", sliders);
    const offset = 20;
    for (const slider of sliders) {
      const label = await slider.getAttribute("aria-label");
      if (!label) continue;

      if (label.includes("top") && label.includes("left")) {
        console.log("Adjusting slider", label);
        const start = await slider.boundingBox();
        if (!start) continue;

        await page.mouse.move(start.x, start.y);
        await page.mouse.down();

        await page.mouse.move(rect.x - offset, rect.y - offset);
        await page.mouse.up();
      }

      if (label.includes("bottom") && label.includes("right")) {
        console.log("Adjusting slider", label);
        const start = await slider.boundingBox();
        if (!start) continue;

        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(
          rect.x + rect.width + offset,
          rect.y + rect.height + offset
        );
        await page.mouse.up();
      }
    }

    console.log("Waiting for 'Visual matches' reload'");
    try {
      await page
        .getByText("Visual matches")
        .waitFor({ state: "hidden", timeout: 5000 });
    } catch (e) {}
    await page.getByText("Visual matches").waitFor({ state: "visible" });

    console.log("Getting all items");
    const items = await page.locator(".G19kAf.ENn9pd").all();

    const records = [];
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
