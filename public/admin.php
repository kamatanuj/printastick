<?php
// Simple admin page to view inquiries
header('Content-Type: text/html; charset=utf-8');

// Basic auth (change these credentials!)
$valid_users = ['admin' => 'printastick2024'];

// Check if already logged in
session_start();
$logged_in = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

// Handle login
if (isset($_POST['login'])) {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (isset($valid_users[$username]) && $valid_users[$username] === $password) {
        $_SESSION['logged_in'] = true;
        $_SESSION['username'] = $username;
        $logged_in = true;
    } else {
        $error = "Invalid credentials!";
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit();
}

// Handle export
if (isset($_GET['export']) && $logged_in) {
    $db = new SQLite3(__DIR__ . '/inquiries.db');
    $results = $db->query("SELECT * FROM inquiries ORDER BY created_at DESC");
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="inquiries_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, ['ID', 'Name', 'Organization', 'Email', 'Phone', 'Subject', 'Message', 'Date']);
    
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        fputcsv($output, [
            $row['id'],
            $row['name'],
            $row['organization'],
            $row['email'],
            $row['phone'],
            $row['subject'],
            $row['message'],
            $row['created_at']
        ]);
    }
    fclose($output);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printastick - Admin Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
<?php if (!$logged_in): ?>
    <!-- Login Form -->
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 class="text-2xl font-bold mb-6">Admin Login</h1>
            <?php if (isset($error)): ?>
                <div class="bg-red-100 text-red-700 p-3 rounded mb-4"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Username</label>
                    <input type="text" name="username" required class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" name="password" required class="w-full px-4 py-2 border rounded-lg">
                </div>
                <button type="submit" name="login" class="w-full bg-navy-500 text-white py-2 rounded-lg hover:bg-navy-600">
                    Login
                </button>
            </form>
        </div>
    </div>
<?php else: ?>
    <!-- Admin Panel -->
    <div class="container mx-auto px-6 py-8">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Inquiries Admin Panel</h1>
            <div class="flex gap-4">
                <a href="?export=1" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    Export CSV
                </a>
                <a href="?logout=1" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    Logout
                </a>
            </div>
        </div>
        
        <?php
        // Connect to database and fetch inquiries
        try {
            $db = new SQLite3(__DIR__ . '/inquiries.db');
            $count = $db->querySingle("SELECT COUNT(*) FROM inquiries");
            echo "<div class='bg-blue-100 text-blue-700 p-4 rounded-lg mb-6'>Total Inquiries: <strong>$count</strong></div>";
            
            $results = $db->query("SELECT * FROM inquiries ORDER BY created_at DESC");
            
            if ($count > 0):
        ?>
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <?php while ($row = $results->fetchArray(SQLITE3_ASSOC)): ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4"><?php echo $row['id']; ?></td>
                        <td class="px-6 py-4 font-medium"><?php echo htmlspecialchars($row['name']); ?></td>
                        <td class="px-6 py-4"><?php echo htmlspecialchars($row['email']); ?></td>
                        <td class="px-6 py-4"><?php echo htmlspecialchars($row['organization'] ?? '-'); ?></td>
                        <td class="px-6 py-4"><?php echo htmlspecialchars($row['phone'] ?? '-'); ?></td>
                        <td class="px-6 py-4"><?php echo htmlspecialchars($row['subject']); ?></td>
                        <td class="px-6 py-4 text-sm text-gray-500"><?php echo $row['created_at']; ?></td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        </div>
        <?php 
            else:
                echo "<p class='text-gray-500 text-center py-12'>No inquiries yet.</p>";
            endif;
        } catch (Exception $e) {
            echo "<div class='bg-red-100 text-red-700 p-4 rounded-lg'>Database error: " . htmlspecialchars($e->getMessage()) . "</div>";
        }
        ?>
    </div>
<?php endif; ?>
</body>
</html>
