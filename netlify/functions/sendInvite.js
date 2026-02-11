
import nodemailer from "nodemailer";
import qrcode from "qrcode";

export async function handler(event) {
  try {
    
    const { recipientEmail, recipientName, inviteCode, treeName, role, message, senderName, qrDataUrl, joinUrl } = JSON.parse(event.body || "{}");

    if (!recipientEmail || !inviteCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing recipientEmail or inviteCode" }),
      };
    }

    // Use the join link from the invite service, or create one if not provided
    const joinLink = joinUrl || `https://tafyaa.netlify.app/join?code=${inviteCode}`;

   
    const qrCodeDataURL = qrDataUrl || await qrcode.toDataURL(joinLink, {
      width: 300,
      margin: 2,
      color: {
        dark: '#f9a406',
        light: '#FFFFFF'
      }
    });

    // Create the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Construct the message
    const mailOptions = {
      from: `Taf'yaa <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `🌳 You're invited to join the "${treeName || 'Family Tree'}" family on Taf'yaa!`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 5px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f9a406; margin: 0; font-size: 28px;">Welcome to Taf'yaa!</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">Your family tree awaits</p>
            </p>

            <p style="margin-bottom: 25px;">
              Hi ${recipientName || "there"},<br>
              You've been granted membership to join the <strong>"${treeName || 'Family Tree'}" Family </strong> as a <strong>${role || 'member'}</strong>.
            </p>

            ${message ? `
            <div style="background: #f8f9fa; border-left: 4px solid #f9a406; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #495057;">
                <strong>Personal Message:</strong><br>
                ${message.replace(/\n/g, '<br>')}<br><br>
                Best regards,<br>
                ${senderName || 'The Tree Admin'}
              </p>
            </div>
            ` : `
            <p style="margin-bottom: 25px;">
              Best regards,<br>
              ${senderName || 'The Tree Admin'}
            </p>
            `}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${joinLink}" style="display: inline-block; background: linear-gradient(135deg, #f9a406 0%, #e85d04 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(249, 160, 6, 0.3);">
                Accept Your Invitation
              </a>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; text-align: center; color: #495057; font-size: 14px;">
                <strong>Invite Code:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${inviteCode}</code>
              </p>
            </div>

            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                This invitation will expire in 30 days.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent successfully!" }),
    };
  } catch (error) {
    console.error("Send invite failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
}
