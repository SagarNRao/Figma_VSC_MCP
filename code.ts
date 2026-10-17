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

// cant import anything into figma runtime, cant use usestate 😔😔😔😔
let STATE_fileKey = "";
let STATE_nodeId = "";

let STATE_node;
let STATE_imageURL;

const getImageURL = "https://api.figma.com/v1/images/" + STATE_fileKey + "?ids=" + STATE_nodeId + "&format=png&scale=1&use_absolute_bounds=true";
// const FigmaKEY = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const serverURL = "http://localhost:3000"

STATE_fileKey = figma.fileKey || "";

const getImage = async () => {
  try {
    const endpoint = `${serverURL}/getImage?url=${encodeURIComponent(getImageURL)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body:
        JSON.stringify({
          "fileKey": STATE_fileKey,
          "nodeId": STATE_nodeId
        })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    // Figma returns the temporary S3 URL nested inside data.images[nodeId]
    const imageUrl = data.images && data.images[STATE_nodeId];
    console.log("IMAGE URL HERE: ", imageUrl);
    STATE_imageURL = imageUrl;

  } catch (error) {
    console.error("Failed to retrieve image URL:", error);
  }
};

const createPayload = async () => {
  // store node json and image url

}
const newGetImage = async (content: Uint8Array) => {
  const response = await fetch(`${serverURL}/convert-to-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream", // Sending raw binary
    },
    body: content, // Pass the Uint8Array directly
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  const data = await response.json();
  console.log("Image saved on server:", data.path);
};


figma.ui.onmessage = async (msg: {
  fileUrl: any; type: string, count: number
}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.


  if (msg.type === 'set-file-url') {
    const segments = msg.fileUrl.split('/');
    const designIndex = segments.findIndex((seg: string) => seg === 'design' || seg === 'file');

    STATE_fileKey = designIndex !== -1 ? segments[designIndex + 1] : null;
    console.log("FILE Key HERE: ", STATE_fileKey);
  }

  if (msg.type === 'get-selection') {

    for (const node of figma.currentPage.selection) {
      console.log("NODE ID HERE: ", node.id);
      console.log("FILE Key HERE: ", STATE_fileKey);


      // SET NODE ID
      STATE_nodeId = node.id;
      STATE_node = JSON.stringify(node);

      console.log(STATE_node)

      console.log("CALLING getImage() ");
      // await getImage();

      const bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 1 }, // or 0.5 if it's massive
      });

      console.log(bytes);
      await newGetImage(bytes);
      // send bytes object as uint8 array to server
      // new Blob([content.buffer], { type: 'image/png' } 


    }
  }

};
