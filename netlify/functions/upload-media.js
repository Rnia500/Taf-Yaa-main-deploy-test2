const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "tafyaa"; // change this if you want dynamic folders later

    // Generate secure signature
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        timestamp,
        signature,
        cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.VITE_CLOUDINARY_API_KEY,
        folder,
      }),
    };
  } catch (err) {
    console.error("Signature error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
