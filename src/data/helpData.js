export default [
    {
        title: 'Notification PUSH',
        key: 'push',
        content: "L’authentification par Push mobile envoie une notification sur le smartphone de l’utilisateur lorsqu’une connexion est tentée. L’utilisateur doit alors approuver ou refuser la demande via l’application dédiée. Ce procédé ajoute une couche de sécurité en exigeant une validation explicite sur un appareil personnel. Pour activer cette méthode, scanner le QRCode affiché sur le portail de gestion de l'authentification renforcée.",
    },
    {
        title: 'TOTP',
        key: 'totp',
        content: "La méthode TOTP fournit un code de sécurité qui se renouvelle automatiquement toutes les 30 secondes. L’utilisateur doit saisir ce code en complément de son mot de passe afin de confirmer son identité. Ce mécanisme renforce la sécurité en rendant l’accès beaucoup plus difficile pour un tiers non autorisé. Pour activer cette méthode, scanner le QRCode affiché sur le portail de gestion de l'authentification renforcée."
    },
    {
        title: 'NFC',
        key: 'nfc',
        content: "L’authentification par NFC utilise une carte physique (étudiant ou professionnel) équipée d’une puce sans contact. L’utilisateur présente sa carte devant un lecteur compatible pour valider son identité. Cette méthode renforce la sécurité en combinant la possession d’un support physique avec le contrôle d’accès numérique. Pour activer cette méthode, scanner le QRCode affiché sur la mire d'authentification."
    },
]

export const getHelpByKey = (key) => {
    const helpData = require('./helpData').default;
    return helpData.find(item => item.key === key);
}