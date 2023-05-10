import { chromium } from "playwright";

type File = {
  /**
   * File name
   */
  name: string;

  /**
   * File type
   */
  mimeType: string;

  /**
   * File content
   */
  buffer: Buffer;
};

type FileArg = string | string[] | File | File[];

interface VisualMatchRecord {
  position: number;
  link: string;
  title: string;
  thumbnail: string;
}

export async function executeVisualSearch(
  file: FileArg
): Promise<VisualMatchRecord[]> {
  // open browser
  const browser = await chromium.launch();

  // open new tab
  const page = await browser.newPage();

  // go to google
  await page.goto("https://www.google.com");

  // click search by image button
  await page.getByRole("button", { name: "Search by image" }).click();

  // click upload an image button and upload image
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "upload a file" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(file);

  // wait for text:visual matches to be visible
  await page.getByText("Visual matches").waitFor({ state: "visible" });

  // get all items
  const items = await page.locator(".G19kAf.ENn9pd").all();

  const records = [];
  for (const item of items) {
    // scroll to item
    await item.scrollIntoViewIfNeeded();

    // get link, title, and thumbnail
    const link = await item.getByRole("link").getAttribute("href");
    const title = await item.locator(".UAiK1e").textContent();
    const thumbnail = await item.locator(".wETe9b.jFVN1").getAttribute("src");

    // if any of them is missing, skip
    if (!link || !title || !thumbnail) {
      continue;
    }

    // add to records
    records.push({
      position: items.indexOf(item),
      link,
      title,
      thumbnail,
    });
  }

  await browser.close();

  return records;
}
