const express = require("express");
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();
const port = 3000; // You can change the port

// Endpoint to scrape data and extract download links
app.get("/scrape", async (req, res) => {
  try {
    const url =
      "https://dudefilms.my/lal-salaam-2024-hindi-dubbed-movie-hdtv-esub-480p-720p-1080p/";

    const response = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
        "Cache-Control": "max-age=0",
        Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
        DNT: "1",
        Referer: "https://dudefilms.my/",
        "Sec-CH-UA":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Android"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.109 Safari/537.36 CrKey/1.54.248666",
      },
      responseType: "arraybuffer",
    });

    const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");
    const dom = new JSDOM(decodedHtml);
    const doc = dom.window.document;

    const h4Elements = doc.querySelectorAll("h4");
    const buttonText = [];
    h4Elements.forEach((title) => {
      if (title && title.textContent) {
        buttonText.push(title.textContent.trim());
      }
    });

    const downloadLinkElements = doc.querySelectorAll(
      ".maxbutton-download-link"
    );
    const hrefs = [];
    downloadLinkElements.forEach((link) => {
      if (link.hasAttribute("href")) {
        hrefs.push(link.getAttribute("href"));
      }
    });

    const imgElements = doc.querySelectorAll("p img");
    const imgSrcs = [];
    imgElements.forEach((img) => {
      imgSrcs.push(img.src);
    });

    const downloadInfo = [];
    buttonText.forEach((text, index) => {
      if (hrefs[index]) {
        downloadInfo.push({
          title: text,
          link: hrefs[index],
        });
      }
    });
    downloadInfo.push({
      imgSrcs,
    });

    // Corrected convertData function
    const convertData = function (downloadInfo) {
      const downloadData = [];
      const imageData = [];

      downloadInfo.forEach((item) => {
        if (item.title && item.link) {
          downloadData.push({
            title: item.title,
            link: item.link,
          });
        }
        if (item.imgSrcs) {
          item.imgSrcs.forEach((imgSrc) => {
            if (imgSrc.startsWith("https://catimages.org/images")) {
              imageData.push(imgSrc);
            }
          });
        }
      });

      return {
        downloaddata: downloadData,
        imagedata: imageData,
      };
    };

    // Respond with the converted data
    res.json(convertData(downloadInfo));
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch data using links from /scrape
app.get("/download-data", async (req, res) => {
  try {
    // Call /scrape to get links
    const scrapeResponse = await axios.get(`http://localhost:${port}/scrape`);

    const downloadLinks = scrapeResponse.data.downloaddata;

    if (!Array.isArray(downloadLinks) || downloadLinks.length === 0) {
      return res.status(400).json({ error: "No download links found." });
    }

    const finalUrls = [];

    // Fetch data for each link
    for (const item of downloadLinks) {
      const url = item.link;

      try {
        const fetchResponse = await axios.get(url, {
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language":
              "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
            "Cache-Control": "max-age=0",
            DNT: "1",
            "Sec-CH-UA":
              '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": '"Android"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent":
              "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.109 Safari/537.36 CrKey/1.54.248666",
          },
          responseType: "arraybuffer",
        });

        const decodedHtml = Buffer.from(fetchResponse.data, "binary").toString(
          "utf8"
        );
        const dom = new JSDOM(decodedHtml);
        const document = dom.window.document;

        // Find the anchor tag with innerText "Google Drive (Direct)"
        const anchor = Array.from(document.querySelectorAll("a")).find((a) => {
          return a.textContent.trim() === "✅ Google Drive (Direct)";
        });

        if (anchor) {
          finalUrls.push({
            title: item.title,

            finalLink: anchor.href,
          });
        } else {
          finalUrls.push({
            title: item.title,

            finalLink: null,
            error: "Google Drive (Direct) link not found.",
          });
        }
      } catch (fetchError) {
        console.error(`Error fetching data for ${url}:`, fetchError.message);
        finalUrls.push({
          title: item.title,
          error: fetchError.message,
        });
      }
    }

    res.json(finalUrls);
  } catch (error) {
    console.error("Error processing download-data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to scrape data and extract download links

app.get("/testdownload", async (req, res) => {
  try {
    // Call the /download-data API to get the list of download data (including title and finalLink)
    const downloadDataResponse = await axios.get(
      "http://localhost:3000/download-data"
    );

    // Extract the title and finalLinks from the response data
    console.log(downloadDataResponse.data);

    const downloadData = downloadDataResponse.data;

    // Initialize an array to store the download information
    const downloadResults = [];

    // Iterate over each item in the download data
    for (const item of downloadData) {
      const { title, finalLink } = item;

      const response = await axios.get(finalLink, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
          "Cache-Control": "max-age=0",
          Cookie: "_lscache_vary=00e02ac3526ebf42934719326cc549fc",
          DNT: "1",
          Referer: "https://dudefilms.my/",
          "Sec-CH-UA":
            '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "Sec-CH-UA-Mobile": "?0",
          "Sec-CH-UA-Platform": '"Android"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.109 Safari/537.36 CrKey/1.54.248666",
        },
        responseType: "arraybuffer",
      });

      const decodedHtml = Buffer.from(response.data, "binary").toString("utf8");

      // Use jsdom to parse the HTML
      const dom = new JSDOM(decodedHtml);
      const document = dom.window.document;

      // Find the <a> tag with the inner text 'Instant DL [10GBPS]'
      const downloadLink = [...document.querySelectorAll("a")].find((a) =>
        a.textContent.includes("Instant DL [10GBPS]")
      );

      if (downloadLink) {
        // Extract the href attribute and add it to the result
        const downloadHref = downloadLink.href;
        downloadResults.push({ title, finalLink, downloadHref });
      } else {
        downloadResults.push({
          title,
          finalLink,
          error: "Download link not found",
        });
      }
    }

    // Return the array of download data (title, finalLink, downloadHref or error)
    res.json(downloadResults);
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
