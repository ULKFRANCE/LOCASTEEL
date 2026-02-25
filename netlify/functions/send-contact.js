const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { nom, prenom, email, telephone, besoin, message } = data;

    // Configuration du transporteur email (utilise les variables d'environnement Netlify)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.eu',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Contenu de l'email
    const mailOptions = {
      from: `"Site LOCASTEEL" <${process.env.SMTP_USER}>`,
      to: 'contact@locasteel.com',
      replyTo: email,
      subject: `[LOCASTEEL] Nouvelle demande de ${prenom} ${nom} - ${besoin || 'Contact'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #DC143C 0%, #A91B2E 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nouvelle demande de contact</h1>
          </div>
          <div style="padding: 30px; background: #f8f8f8;">
            <h2 style="color: #333; border-bottom: 2px solid #DC143C; padding-bottom: 10px;">Informations client</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; width: 150px;">Nom :</td>
                <td style="padding: 10px 0;">${nom}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Prénom :</td>
                <td style="padding: 10px 0;">${prenom || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Email :</td>
                <td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Téléphone :</td>
                <td style="padding: 10px 0;"><a href="tel:${telephone}">${telephone}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Besoin :</td>
                <td style="padding: 10px 0;">${besoin || 'Non spécifié'}</td>
              </tr>
            </table>
            
            <h2 style="color: #333; border-bottom: 2px solid #DC143C; padding-bottom: 10px; margin-top: 30px;">Message</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #DC143C;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #e8f5e9; border-radius: 8px;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>💡 Conseil :</strong> Répondez rapidement à ce prospect pour maximiser vos chances de conversion !
              </p>
            </div>
          </div>
          <div style="background: #333; padding: 15px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              Email envoyé automatiquement depuis le site www.locasteel.com
            </p>
          </div>
        </div>
      `,
      text: `
Nouvelle demande de contact LOCASTEEL

Nom: ${nom}
Prénom: ${prenom || 'Non renseigné'}
Email: ${email}
Téléphone: ${telephone}
Besoin: ${besoin || 'Non spécifié'}

Message:
${message}

---
Email envoyé depuis www.locasteel.com
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
    };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
