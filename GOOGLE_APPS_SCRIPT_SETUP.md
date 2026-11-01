# Connect Drive folders to the catalog

The website uses a small Google Apps Script to list image files from the Drive folders in the catalog CSV. It does not need a Google Cloud API key.

## One-time setup

1. Make sure the current `ganesh-handloom-products.csv` is published on the GitHub Pages site and the `Photo` column contains each design's Drive folder link.
2. Open [script.google.com](https://script.google.com/) and create a new project.
3. Replace the editor contents with the code in `Code.gs`, then save the project.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy and approve the requested Google Drive read access.
6. Copy the web app URL ending in `/exec`.
7. In `app.js`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` in `driveListingUrl` with that URL.
8. Upload the updated `app.js`, `index.html`, `style.css`, and `ganesh-handloom-products.csv` to the GitHub repository.

## Updating products later

- Add photos directly inside the design's shared Drive folder. The website will list them on its next page load.
- Update product details or add a new design/folder in the CSV, then upload the updated CSV to GitHub. The script reads the published CSV each time, so it does not need to be redeployed for catalog changes.
- Keep each design folder shared as **Anyone with the link — Viewer**.
