export default [
    {
        title: 'Notification PUSH',
        key: 'push',
        content: "Pour utiliser la notification push, vous pouvez saisir les informations d'activation ou utiliser l'option 'Activation QRCode' dans Esup-otp-manager (Menu latéral > PUSH > Activation QRCode) et scannez le code affiché pour pouvoir recevoir la notification.",
    },
    {
        title: 'TOTP',
        key: 'totp',
        content: "Pour utiliser la méthode TOTP, vous devez aller dans l'application Esup-otp-manager pour activer la méthode 'TOTP', ensuite appuyez sur le bouton 'Générer un QrCode', puis scannez le code à l'aide de votre application Esup Auth ou entrez le code directement dans votre application TOTP."
    },
    {
        title: 'NFC',
        key: 'nfc',
        content: "Pour utiliser la méthode NFC, vous pouvez scanner le code NFC de votre établissement ou saisir les informations d'activation manuellement."
    },
]