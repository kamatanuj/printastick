<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Validate required fields
$required = ['name', 'email', 'subject', 'message'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

// Sanitize inputs
$name = filter_var($input['name'], FILTER_SANITIZE_STRING);
$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$organization = filter_var($input['organization'] ?? '', FILTER_SANITIZE_STRING);
$phone = filter_var($input['phone'] ?? '', FILTER_SANITIZE_STRING);
$subject = filter_var($input['subject'], FILTER_SANITIZE_STRING);
$message_text = filter_var($input['message'], FILTER_SANITIZE_STRING);

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit();
}

try {
    // Connect to SQLite database
    $db_path = __DIR__ . '/inquiries.db';
    $db = new SQLite3($db_path);
    
    // Create table if not exists (matches Node.js schema)
    $db->exec("CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        organization TEXT,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Insert inquiry
    $stmt = $db->prepare("INSERT INTO inquiries (name, organization, email, phone, subject, message) 
                          VALUES (:name, :organization, :email, :phone, :subject, :message)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':organization', $organization, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':phone', $phone, SQLITE3_TEXT);
    $stmt->bindValue(':subject', $subject, SQLITE3_TEXT);
    $stmt->bindValue(':message', $message_text, SQLITE3_TEXT);
    
    $result = $stmt->execute();
    
    if (!$result) {
        throw new Exception('Failed to save inquiry to database');
    }
    
    $inquiry_id = $db->lastInsertRowID();
    $db->close();
    
    // Send email notification
    $to = "nirav_joshi@hotmail.com, nirav@printastick.com";
    $email_subject = "New Inquiry #$inquiry_id: $subject";
    $email_body = "New inquiry received via Printastick website:\n\n";
    $email_body .= "Name: $name\n";
    $email_body .= "Email: $email\n";
    $email_body .= "Organization: $organization\n";
    $email_body .= "Phone: $phone\n";
    $email_body .= "Subject: $subject\n";
    $email_body .= "Message:\n$message_text\n";
    $email_body .= "\n---\n";
    $email_body .= "Inquiry ID: #$inquiry_id\n";
    $email_body .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    $headers = "From: website@printastick.com\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Try to send email (may fail on shared hosting)
    $mail_sent = @mail($to, $email_subject, $email_body, $headers);
    
    echo json_encode([
        'success' => true,
        'inquiry_id' => $inquiry_id,
        'email_sent' => $mail_sent
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
