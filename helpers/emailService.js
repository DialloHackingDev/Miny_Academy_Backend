/**
 * 📧 Email Configuration & Helper
 * Configuration nodemailer et templates email
 */

const nodemailer = require('nodemailer');
const asyncHandler = require('./asyncHandler');

// ✅ Configuration du transporteur email
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
    }
});

// ✅ Vérifier la connexion au service email
if (process.env.NODE_ENV !== 'test') {
    emailTransporter.verify((error, success) => {
        if (error) {
            console.warn('⚠️  Email service not available:', error.message);
        } else {
            console.log('✅ Email service ready');
        }
    });
}

/**
 * 📧 Templates Email
 */
const emailTemplates = {
    // Template: Confirmation d'achat
    purchaseConfirmation: (userName, courseName, price, transactionId) => ({
        subject: `Confirmation d'achat - ${courseName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Merci pour votre achat! 🎓</h2>
                
                <p>Bonjour ${userName},</p>
                
                <p>Votre achat a été confirmé. Voici d'détails:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Cours:</strong> ${courseName}</p>
                    <p><strong>Prix:</strong> ${price} MAD</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <p>Vous pouvez maintenant accéder au cours dans votre tableau de bord.</p>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/course-player" 
                   style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Accéder au cours
                </a>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    Si vous avez des questions, veuillez contacter notre support.
                </p>
            </div>
        `
    }),

    // Template: Échec de paiement
    paymentFailed: (userName, courseName, error) => ({
        subject: `Échec du paiement - ${courseName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">Paiement non approuvé ❌</h2>
                
                <p>Bonjour ${userName},</p>
                
                <p>Malheureusement, votre paiement pour le cours <strong>${courseName}</strong> n'a pas pu être traité.</p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p><strong>Raison:</strong> ${error}</p>
                    <p>Veuillez vérifier vos informations de paiement et réessayer.</p>
                </div>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart" 
                   style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Réessayer le paiement
                </a>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    Besoin d'aide? Contactez notre support.
                </p>
            </div>
        `
    }),

    // Template: Nouvel étudiant inscrit
    studentEnrolled: (professorName, studentName, courseName) => ({
        subject: `Nouvel étudiant inscrit - ${courseName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4caf50;">Nouvel étudiant inscrit! 🎉</h2>
                
                <p>Bonjour ${professorName},</p>
                
                <p>Un nouvel étudiant s'est inscrit à votre cours:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Étudiant:</strong> ${studentName}</p>
                    <p><strong>Cours:</strong> ${courseName}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="display: inline-block; background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Voir le tableau de bord
                </a>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    C'est une notification automatique, veuillez ne pas répondre à cet email.
                </p>
            </div>
        `
    }),

    // Template: Notification de revue
    newReview: (professorName, courseName, authorName, rating) => ({
        subject: `Nouvelle revue sur ${courseName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff9800;">Nouvelle revue reçue! ⭐</h2>
                
                <p>Bonjour ${professorName},</p>
                
                <p>Vous avez reçu une nouvelle revue sur votre cours:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Cours:</strong> ${courseName}</p>
                    <p><strong>Auteur:</strong> ${authorName}</p>
                    <p><strong>Note:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="display: inline-block; background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Voir les commentaires
                </a>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    C'est une notification automatique, veuillez ne pas répondre à cet email.
                </p>
            </div>
        `
    })
};

/**
 * ✅ Envoyer un email
 */
const sendEmail = asyncHandler(async (to, subject, html) => {
    // Skip en mode test
    if (process.env.NODE_ENV === 'test') {
        console.log('📧 [TEST MODE] Email skipped:', subject);
        return { success: true, testMode: true };
    }

    // Vérifier configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️  Email not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
        return { success: false, reason: 'Email not configured' };
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Email error:', error.message);
        return { success: false, error: error.message };
    }
});

/**
 * ✅ Envoyer email de confirmation d'achat
 */
const sendPurchaseConfirmationEmail = asyncHandler(async (userEmail, userName, courseName, price, transactionId) => {
    const template = emailTemplates.purchaseConfirmation(userName, courseName, price, transactionId);
    return await sendEmail(userEmail, template.subject, template.html);
});

/**
 * ✅ Envoyer email d'échec de paiement
 */
const sendPaymentFailedEmail = asyncHandler(async (userEmail, userName, courseName, error) => {
    const template = emailTemplates.paymentFailed(userName, courseName, error);
    return await sendEmail(userEmail, template.subject, template.html);
});

/**
 * ✅ Envoyer email au professeur d'un nouvel étudiant
 */
const sendStudentEnrollmentEmail = asyncHandler(async (professorEmail, professorName, studentName, courseName) => {
    const template = emailTemplates.studentEnrolled(professorName, studentName, courseName);
    return await sendEmail(professorEmail, template.subject, template.html);
});

/**
 * ✅ Envoyer email au professeur d'une nouvelle revue
 */
const sendNewReviewEmail = asyncHandler(async (professorEmail, professorName, courseName, authorName, rating) => {
    const template = emailTemplates.newReview(professorName, courseName, authorName, rating);
    return await sendEmail(professorEmail, template.subject, template.html);
});

module.exports = {
    sendEmail,
    sendPurchaseConfirmationEmail,
    sendPaymentFailedEmail,
    sendStudentEnrollmentEmail,
    sendNewReviewEmail,
    emailTemplates
};
