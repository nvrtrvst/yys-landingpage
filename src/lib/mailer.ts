import nodemailer from "nodemailer";

// Cache transporter at module level — avoids creating a new connection object on each request
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

export async function sendPPDBSingleEmail({
  to,
  registration_number,
  student_name,
  unit,
  grade
}: {
  to: string;
  registration_number: string;
  student_name: string;
  unit: string;
  grade: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP settings are not configured. Email will not be sent.");
    return;
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"Panitia PPDB ${unit}" <info@nuurulmuttaqiin.or.id>`,
    to: to,
    subject: `Bukti Pendaftaran PPDB - ${student_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #166534; text-align: center;">Pendaftaran Berhasil!</h2>
        <p>Halo,</p>
        <p>Terima kasih telah melakukan pendaftaran peserta didik baru (PPDB) di Yayasan Nuurul Muttaqiin. Berikut adalah data pendaftaran Anda:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 40%;">No Pendaftaran</td>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${registration_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Nama Siswa</td>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${student_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Unit & Kelas</td>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${unit} - Kelas ${grade}</td>
            </tr>
          </table>
        </div>

        <p>Anda dapat mengecek status pendaftaran Anda secara berkala melalui tautan berikut:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/ppdb/status" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Cek Status Pendaftaran</a>
        </p>

        <p style="color: #64748b; font-size: 14px;">Silakan simpan email ini sebagai bukti pendaftaran Anda.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Panitia PPDB Yayasan Nuurul Muttaqiin<br/>
          Pesan ini dikirim secara otomatis oleh sistem.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export async function sendPPDBStatusEmail({
  to,
  registration_number,
  student_name,
  status,
  unit
}: {
  to: string;
  registration_number: string;
  student_name: string;
  status: string;
  unit: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP settings are not configured. Email will not be sent.");
    return;
  }

  const transporter = getTransporter();

  const statusColor = status === 'Diterima' ? '#16a34a' : (status === 'Ditolak' ? '#dc2626' : '#ca8a04');
  let statusMessage = 'Status Anda saat ini sedang dalam <b>PROSES</b>';
  if (status === 'Diterima') {
    statusMessage = 'Selamat! Anda telah dinyatakan <b>DITERIMA</b>';
  } else if (status === 'Ditolak') {
    statusMessage = 'Mohon maaf, Anda dinyatakan <b>DITOLAK</b>';
  }

  const mailOptions = {
    from: `"Panitia PPDB ${unit} Nuurul Muttaqiin" <info@nuurulmuttaqiin.or.id>`,
    to: to,
    subject: `Update Status PPDB - ${student_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${statusColor}; text-align: center;">Update Status Pendaftaran</h2>
        <p>Halo,</p>
        <p>Berikut adalah update status pendaftaran peserta didik baru (PPDB) atas nama <b>${student_name}</b> dengan nomor pendaftaran <b>${registration_number}</b>.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 16px;">${statusMessage}.</p>
        </div>

        <p>Anda dapat mengecek detail pendaftaran Anda secara berkala melalui tautan berikut:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/ppdb/status" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Cek Status Pendaftaran</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Panitia PPDB Yayasan Nuurul Muttaqiin<br/>
          Pesan ini dikirim secara otomatis oleh sistem.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email status sent successfully to", to);
  } catch (error) {
    console.error("Error sending status email:", error);
  }
}
