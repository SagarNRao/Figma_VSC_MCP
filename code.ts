// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
/// <reference types="@figma/plugin-typings" />
// This shows the HTML page in "ui.html".
figma.showUI(__html__);



// import * as dotenv from 'dotenv';
// dotenv.config();

let fileKey = "";
let nodeId = "";

const getImageURL = "https://api.figma.com/v1/images/" + fileKey + "?ids=" + nodeId + "&format=png&scale=1&use_absolute_bounds=true";
// const FigmaKEY = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const serverURL = "http://localhost:3000" 


fileKey = figma.fileKey || "";

const getImage = async () => {
  try {
    const endpoint = `${serverURL}/getImage?url=${encodeURIComponent(getImageURL)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    // Figma returns the temporary S3 URL nested inside data.images[nodeId]
    const imageUrl = data.images && data.images[nodeId];
    console.log("IMAGE URL HERE: ", imageUrl);

  } catch (error) {
    console.error("Failed to retrieve image URL:", error);
  }
};

figma.ui.onmessage = async (msg: {
  fileUrl: any; type: string, count: number
}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  

  if (msg.type === 'set-file-url') {
    const segments = msg.fileUrl.split('/');
    const designIndex = segments.findIndex((seg: string) => seg === 'design' || seg === 'file');

    const fileKey = designIndex !== -1 ? segments[designIndex + 1] : null;
    console.log("FILE Key HERE: ", fileKey);
  }

  if (msg.type === 'get-selection') {
    for (const node of figma.currentPage.selection) {
      console.log("NODE ID HERE: ", node.id);
      console.log("FILE Key HERE: ", fileKey);

      // SET NODE ID
      nodeId = node.id;

      console.log("CALLING getImage()");
      

    }
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
