// Paste this file into a new Google Apps Script project and deploy it as a web app.
// The endpoint reads only folder links from the public catalog CSV and returns
// image IDs, so the website can render each photo separately without a Drive API key.

const CATALOG_CSV_URL = "https://ganesh-ganji.github.io/Handloom/ganesh-handloom-products.csv";
const JSONP_CALLBACK = "ganeshHandloomDriveData";

function doGet(e) {
  const callback = e && e.parameter ? String(e.parameter.prefix || "") : "";
  if (callback !== JSONP_CALLBACK) {
    return ContentService.createTextOutput("Invalid request")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  let result;
  try {
    const response = UrlFetchApp.fetch(CATALOG_CSV_URL + "?v=" + Date.now(), {
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error("The public product CSV could not be loaded.");
    }

    const rows = Utilities.parseCsv(response.getContentText());
    if (rows.length < 2) {
      result = { images: [] };
    } else {
      const headers = rows[0].map(value => String(value).trim().toLowerCase());
      let photoColumn = headers.indexOf("photo");
      if (photoColumn < 0) photoColumn = headers.indexOf("photos");
      if (photoColumn < 0) throw new Error("The CSV needs a Photo column.");

      const folderIds = new Set();
      rows.slice(1).forEach(row => {
        const cell = String(row[photoColumn] || "");
        const match = cell.match(/\/folders\/([\w-]{20,})/);
        if (match) folderIds.add(match[1]);
      });

      const images = [];
      folderIds.forEach(folderId => {
        const files = DriveApp.getFolderById(folderId).getFiles();
        while (files.hasNext()) {
          const file = files.next();
          if (file.getMimeType().indexOf("image/") === 0) {
            images.push({ folderId: folderId, id: file.getId() });
          }
        }
      });
      result = { images: images };
    }
  } catch (error) {
    console.error(error);
    result = {
      error: "Could not list Drive photos. Check that the script is authorized and the folders are shared for viewing."
    };
  }

  return ContentService.createTextOutput(
    JSONP_CALLBACK + "(" + JSON.stringify(result) + ");"
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
