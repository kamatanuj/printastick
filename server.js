const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Email Configuration (SMTP)
// Configure with your SMTP details
const emailConfig = {
  host: 'smtp.dreamhost.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'nirav@printastick.com',
    pass: 't7UZ5.8cyrFh-WHUW7'
  }
};

const EMAIL_TO = ['nirav_joshi@hotmail.com', 'nirav@printastick.com'];

// Create email transporter
let transporter;
try {
  transporter = nodemailer.createTransport(emailConfig);
} catch (e) {
  console.log('⚠️ Email not configured - emails will be logged only');
  transporter = null;
}

// Email sending function
async function sendInquiryEmail(contact) {
  const mailOptions = {
    from: '"Printastick Website" <noreply@printastick.com>',
    to: EMAIL_TO.join(', '),
    subject: `New Inquiry from ${contact.name} - ${contact.organization}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003366; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Printastick®</h1>
          <p style="margin: 5px 0 0;">New Inquiry Received</p>
        </div>
        <div style="padding: 20px; background: #f8f8f8;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contact.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Organization:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${contact.organization}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${contact.email}">${contact.email}</a></td>
            </tr>
            ${contact.phone ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Phone:</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${contact.phone}</td></tr>` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Inquiry Type:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${getInquiryTypeLabel(contact.type)}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <h3 style="color: #003366; margin-bottom: 10px;">Message:</h3>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
              ${contact.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            Submitted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
          </div>
        </div>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log('✓ Email sent to:', EMAIL_TO.join(', '));
      return true;
    } catch (error) {
      console.error('✗ Email error:', error.message);
      return false;
    }
  } else {
    console.log('📧 [EMAIL MOCK] Would send to:', EMAIL_TO.join(', '));
    console.log('📧 Subject:', mailOptions.subject);
    return true; // Still return success for mock mode
  }
}

function getInquiryTypeLabel(type) {
  const labels = { bulk: 'Bulk Order', tender: 'Government Tender', distributor: 'Become a Distributor', custom: 'Custom / Branded Stationery', other: 'Other' };
  return labels[type] || 'Other';
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new Database('printastick.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed distributors if table is empty
const distCount = db.prepare('SELECT COUNT(*) as count FROM distributors').get();
if (distCount.count === 0) {
  const distributors = [
    { name: "Shree Ganesh Stationery", city: "Mumbai", state: "Maharashtra", phone: "+91 98XXX XXXXX", status: "Active" },
    { name: "Rajesh Trading Co.", city: "Delhi", state: "Delhi", phone: "+91 97XXX XXXXX", status: "Active" },
    { name: "KP Enterprises", city: "Bengaluru", state: "Karnataka", phone: "+91 99XXX XXXXX", status: "Active" },
    { name: "Chennai Stationery Mart", city: "Chennai", state: "Tamil Nadu", phone: "+91 94XXX XXXXX", status: "Active" },
    { name: "Hyderabad Poly Products", city: "Hyderabad", state: "Telangana", phone: "+91 96XXX XXXXX", status: "Active" },
    { name: "Patna Office Supplies", city: "Patna", state: "Bihar", phone: "+91 93XXX XXXXX", status: "Active" },
    { name: "Lucknow Distributors", city: "Lucknow", state: "Uttar Pradesh", phone: "+91 91XXX XXXXX", status: "Active" },
    { name: "Kolkata File House", city: "Kolkata", state: "West Bengal", phone: "+91 98XXX XXXXX", status: "Active" },
    { name: "Ahmedabad Poly Traders", city: "Ahmedabad", state: "Gujarat", phone: "+91 97XXX XXXXX", status: "Active" },
    { name: "Jaipur Stationery Link", city: "Jaipur", state: "Rajasthan", phone: "+91 95XXX XXXXX", status: "Active" },
    { name: "Pune Industrial Supplies", city: "Pune", state: "Maharashtra", phone: "+91 99XXX XXXXX", status: "Active" },
    { name: "Bhopal Print Solutions", city: "Bhopal", state: "Madhya Pradesh", phone: "+91 94XXX XXXXX", status: "Active" },
    { name: "Chandigarh Office Hub", city: "Chandigarh", state: "Chandigarh", phone: "+91 96XXX XXXXX", status: "Active" },
    { name: "Thiruvananthapuram Stores", city: "Thiruvananthapuram", state: "Kerala", phone: "+91 93XXX XXXXX", status: "Active" },
    { name: "Guwahati Trading", city: "Guwahati", state: "Assam", phone: "+91 91XXX XXXXX", status: "New" },
  ];

  const insert = db.prepare('INSERT INTO distributors (name, city, state, phone, status) VALUES (?, ?, ?, ?, ?)');
  distributors.forEach(d => insert.run(d.name, d.city, d.state, d.phone, d.status));
  console.log('✓ Seeded distributors database');
}

// API Routes

// Get all contacts (for admin)
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get distributors
app.get('/api/distributors', (req, res) => {
  try {
    const distributors = db.prepare('SELECT * FROM distributors ORDER BY name').all();
    res.json(distributors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, org, email, phone, type, message } = req.body;

    // Validation
    if (!name || !org || !email || !type || !message) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (name, organization, email, phone, inquiry_type, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, org, email, phone || '', type, message);

    // Send email notification
    await sendInquiryEmail({ name, org, email, phone, type, message });

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Inquiry submitted successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
app.delete('/api/contacts/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export contacts as CSV
app.get('/api/contacts/export', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();

    const headers = 'ID,Name,Organization,Email,Phone,Inquiry Type,Message,Submitted Date\n';
    const rows = contacts.map(c =>
      `${c.id},"${c.name}","${c.organization}","${c.email}","${c.phone}","${c.inquiry_type}","${c.message.replace(/"/g, '""')}","${c.created_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=printastick-inquiries.csv');
    res.send(headers + rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎉 Printastick Website Server Running!                  ║
║                                                           ║
║   📍 Local:    http://localhost:${PORT}                      ║
║   📍 Admin:    http://localhost:${PORT}/admin                 ║
║                                                           ║
║   📧 Contact API: POST /api/contact                       ║
║   📋 Contacts:    GET  /api/contacts                       ║
║   📊 Distributors: GET /api/distributors                   ║
║   💾 Export CSV:  GET /api/contacts/export                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
