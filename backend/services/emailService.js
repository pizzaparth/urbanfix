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

// ─────────────────────────────────────────────────────────────────────────────
// Employee / research flows
// ─────────────────────────────────────────────────────────────────────────────

const esc = (v = '') =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FROM = () => process.env.EMAIL_FROM || 'noreply@complaintsystem.gov';

// Deep link the app registers (linking prefix `dsn://`). Override for a hosted
// build, e.g. APP_LINK_BASE=exp://192.168.1.5:8081/--/ while testing in Expo Go.
export const inviteLink = (token) =>
  `${process.env.APP_LINK_BASE || 'dsn://'}set-password?token=${token}`;

const shell = (heading, accent, body) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: ${accent}; text-align: center;">${heading}</h2>
    <hr style="border: 0; border-top: 1px solid #eeeeee;">
    ${body}
    <p style="color: #999999; font-size: 12px; margin-top: 24px;">UrbanFix Portal</p>
  </div>`;

const codeBox = (token) => `
  <p><strong>Your invite code</strong> (open the app → Sign in → "Have an invite code?"):</p>
  <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border: 1px dashed #999; border-radius: 4px; font-family: monospace; font-size: 13px; word-break: break-all;">${token}</div>`;

const deliver = async (mailOptions, label) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`[${label}] Preview URL: ${previewUrl}`);
    return true;
  } catch (error) {
    console.error(`Email delivery error (${label}): ${error.message}`);
    return false;
  }
};

export const sendEmployeeInviteEmail = (email, name, role, token) =>
  deliver(
    {
      from: FROM(),
      to: email,
      subject: 'Your UrbanFix staff account',
      html: shell(
        'Welcome to UrbanFix',
        '#2563EB',
        `<p>Hello ${esc(name)},</p>
         <p>An administrator has created a <strong>${esc(role)}</strong> account for you.
         Choose your own password with the single-use link below. It expires in <strong>72 hours</strong>.</p>
         <p><a href="${inviteLink(token)}">${inviteLink(token)}</a></p>
         ${codeBox(token)}
         <p style="color:#666;font-size:13px;">No password is ever sent by email.</p>`
      ),
    },
    'Employee Invite'
  );

export const sendResearchReceivedEmail = (email, name, referenceId) =>
  deliver(
    {
      from: FROM(),
      to: email,
      subject: 'We received your research access request',
      html: shell(
        'Application received',
        '#2563EB',
        `<p>Dear ${esc(name)},</p>
         <p>Thank you for applying for research access. An administrator will review it and you will hear back by email.</p>
         <p><strong>Reference:</strong> ${esc(referenceId)}</p>`
      ),
    },
    'Research Received'
  );

export const sendResearchApprovedEmail = (email, name, token, days, scope) =>
  deliver(
    {
      from: FROM(),
      to: email,
      subject: 'Your research access has been approved',
      html: shell(
        'Research access approved',
        '#10B981',
        `<p>Dear ${esc(name)},</p>
         <p>Your application was approved. Access lasts <strong>${days} day${days === 1 ? '' : 's'}</strong> from today and then ends automatically.</p>
         <p><strong>Dataset scope:</strong> ${
           scope === 'anonymised_records'
             ? 'Anonymised records (ward-level location, no personal information)'
             : 'Aggregate statistics only'
         }</p>
         <p><strong>Terms:</strong> use the data only for the purpose you described, never attempt to re-identify individuals, and do not redistribute exports. All access is logged.</p>
         <p>Set your password within <strong>72 hours</strong>:</p>
         <p><a href="${inviteLink(token)}">${inviteLink(token)}</a></p>
         ${codeBox(token)}`
      ),
    },
    'Research Approved'
  );

export const sendResearchRejectedEmail = (email, name, note) =>
  deliver(
    {
      from: FROM(),
      to: email,
      subject: 'Update on your research access request',
      html: shell(
        'Application not approved',
        '#B91C1C',
        `<p>Dear ${esc(name)},</p>
         <p>We are unable to approve your research access request at this time.</p>
         <blockquote style="margin:10px 0;padding:10px 15px;background:#f8f9fa;border-left:4px solid #B91C1C;">${esc(
           note || 'No reason provided.'
         )}</blockquote>`
      ),
    },
    'Research Rejected'
  );

export const sendAccessExpiringEmail = (email, name, expiresAt) =>
  deliver(
    {
      from: FROM(),
      to: email,
      subject: 'Your research access expires soon',
      html: shell(
        'Access expiring',
        '#F59E0B',
        `<p>Dear ${esc(name)},</p>
         <p>Your research access ends on <strong>${new Date(expiresAt).toDateString()}</strong>. Export anything you still need before then, or submit a new application.</p>`
      ),
    },
    'Access Expiring'
  );
