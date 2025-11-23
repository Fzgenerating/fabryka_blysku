<?php
// contact.php - prosty skrypt do obsługi formularza kontaktowego

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Nieprawidłowa metoda żądania.'
    ]);
    exit;
}

// Pobranie i podstawowa walidacja danych
$name    = isset($_POST['name']) ? trim($_POST['name']) : '';
$email   = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone   = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Proszę wypełnić wszystkie wymagane pola oznaczone gwiazdką.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Podany adres e-mail jest nieprawidłowy.'
    ]);
    exit;
}

// Konfiguracja adresu docelowego
$to          = 'kontakt.fabrykablysku@gmail.com';
$subjectLine = 'Nowa wiadomość z formularza Fabryka Błysku: ' . $subject;

// Treść wiadomości
$bodyLines = [];
$bodyLines[] = "Imię i nazwisko: " . $name;
$bodyLines[] = "E-mail: " . $email;
if ($phone !== '') {
    $bodyLines[] = "Telefon: " . $phone;
}
$bodyLines[] = "";
$bodyLines[] = "Wiadomość:";
$bodyLines[] = $message;
$body        = implode("\n", $bodyLines);

// Nagłówki
$headers   = [];
$headers[] = 'From: Fabryka Błysku <kontakt.fabrykablysku@gmail.com>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headersStr = implode("\r\n", $headers);

// Wysłanie maila
$sent = @mail($to, $subjectLine, $body, $headersStr);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Dziękujemy za wiadomość. Skontaktujemy się z Tobą tak szybko jak to możliwe.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Nie udało się wysłać wiadomości. Spróbuj ponownie później lub skontaktuj się telefonicznie.'
    ]);
}
