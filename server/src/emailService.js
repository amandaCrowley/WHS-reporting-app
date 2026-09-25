/**
 * emailService.js
 *
 * Provides email notification functionality for the WHS Reporting App.
 *
 * This file is responsible for:
 * - Configuring the Nodemailer email transporter.
 * - Sending an email to the user who originally reported an issue when
 *   the status of that issue is changed.
 * - Including the issue title, previous status, and new status in the email.
 * - Using environment variables to keep email credentials secure.
 * - Printing a confirmation message to the server console when an email
 *   is sent successfully.
 *
 * Author: Grish Gautam
 */

import nodemailer from "nodemailer";

// Create the email transporter using credentials stored in environment variables.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email to the user who reported an issue when its status changes.
 */
export async function sendStatusChangeEmail({
  recipientEmail,
  recipientName,
  issueTitle,
  oldStatus,
  newStatus,
}) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Issue status updated: ${issueTitle}`,
    text: `Hi ${recipientName},

The status of your reported issue "${issueTitle}" has been updated.

Previous status: ${oldStatus}
New status: ${newStatus}

You can log in to the WHS Reporting System to view your issue.

University of Newcastle
WHS Reporting System`,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`Status change email sent successfully to ${recipientEmail}`);

  return info;
}