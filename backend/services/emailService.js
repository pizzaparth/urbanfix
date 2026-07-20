import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporterInstance = null;

// Dynamic transporter fetching with test SMTP fallback
const getTransporter = async () => {
  if (transporterInstance) return transporterInstance;

  const isPlaceholder = !process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_smtp_username';

  if (!isPlaceholder) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporterInstance;
  }

  // Create an Ethereal test account on the fly
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`\n==================================================`);
    console.log(`SMTP Fallback Created (Ethereal test account):`);
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log(`==================================================\n`);
    return transporterInstance;
  } catch (error) {
    console.error('Failed to create Ethereal SMTP test account on-the-fly:', error.message);
    
    // Return a dummy mock transporter that prints output to terminal console
    return {
      sendMail: async (options) => {
        console.log(`\n==================================================`);
        console.log(`[MOCK EMAIL SENT]`);
        console.log(`From:    ${options.from}`);
        console.log(`To:      ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`==================================================\n`);
        return { messageId: 'mock-id-12345' };
      }
    };
  }
};

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@complaintsystem.gov',
    to: email,
    subject: 'Verification Code - UrbanFix Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563EB; text-align: center;">UrbanFix Portal</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee;">
        <p>Dear Citizen,</p>
        <p>Please use the following One-Time Password (OTP) to verify your email and submit your complaint. This OTP is valid for 5 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563EB; padding: 10px 20px; background-color: #f8f9fa; border: 1px dashed #2563EB; border-radius: 4px;">${otp}</span>
        </div>
        <p style="color: #666666; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    
    // Log Ethereal preview link if it exists
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n==================================================`);
      console.log(`Email Preview URL: ${previewUrl}`);
      console.log(`==================================================\n`);
    }
    return true;
  } catch (error) {
    console.error(`Email delivery error: ${error.message}`);
    // Non-blocking fallback: log OTP directly to terminal console so filing flow is never blocked
    console.log(`\n==================================================`);
    console.log(`[FAIL-SAFE LOG] Verification OTP for ${email}: ${otp}`);
    console.log(`==================================================\n`);
    return true;
  }
};

export const sendStatusUpdateEmail = async (email, trackingId, status, remarks) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@complaintsystem.gov',
    to: email,
    subject: `Update on your Complaint [${trackingId}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563EB; text-align: center;">Complaint Status Update</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee;">
        <p>Dear Citizen,</p>
        <p>There has been a status update on your complaint with Tracking ID <strong>${trackingId}</strong>.</p>
        <p><strong>New Status:</strong> <span style="padding: 3px 8px; border-radius: 4px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #cccccc;">${status}</span></p>
        <p><strong>Admin Remarks:</strong></p>
        <blockquote style="margin: 10px 0; padding: 10px 15px; background-color: #f8f9fa; border-left: 4px solid #2563EB; font-style: italic;">
          ${remarks || 'No remarks provided.'}
        </blockquote>
        <p>You can track the live progress of your complaint at any time on our public portal.</p>
      </div>
    `,
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Status Email] Preview URL: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`Email delivery error: ${error.message}`);
    return false;
  }
};

export const sendResolutionEmailWithPdf = async (email, trackingId, remarks, pdfBuffer) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@complaintsystem.gov',
    to: email,
    subject: `Resolved Complaint Receipt [${trackingId}]`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10B981; text-align: center;">Complaint Resolved!</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee;">
        <p>Dear Citizen,</p>
        <p>We are pleased to inform you that your complaint (Tracking ID: <strong>${trackingId}</strong>) has been marked as <strong>Resolved</strong>.</p>
        <p><strong>Admin Remarks:</strong></p>
        <blockquote style="margin: 10px 0; padding: 10px 15px; background-color: #f8f9fa; border-left: 4px solid #10B981; font-style: italic;">
          ${remarks || 'Issue resolved successfully.'}
        </blockquote>
        <p>A formal system-generated resolution receipt has been attached to this email as a PDF for your records.</p>
        <p>Thank you for helping us improve our community services.</p>
      </div>
    `,
    attachments: [
      {
        filename: `Resolution_Receipt_${trackingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Resolution Email] Preview URL: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`Email delivery error: ${error.message}`);
    return false;
  }
};
