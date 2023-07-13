import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const createUser = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        const { email, password } = request.body;

        try {
            const userRecord = await admin.auth().createUser({ email, password });
            response.json({ uid: userRecord.uid });
        } catch (error) {
            response.status(500).json({ error: 'Error al crear el usuario' });
        }
    });
});


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: functions.config().email.user,
        pass: functions.config().email.pass
    }


});


export const sendEmail = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const { email, template, customParameters } = req.body;

        try {
            let mailOptions;

            switch (template) {
                case 'resetPassword':

                    const passwordResetLink = await admin.auth().generatePasswordResetLink(email, {
                        url: 'https://solardrone.app',
                        handleCodeInApp: false
                    });
                    mailOptions = {
                        from: "pruebassolardrone@gmail.com",
                        to: email,
                        subject: 'Restablece tu contraseña',
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                            <h2 style="color: #34495e;">Restablece tu contraseña</h2>
                            <p style="font-size: 16px; color: #333;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Solardrone.</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p style="font-size: 16px; color: #333;">Haz clic en el botón de abajo para restablecer tu contraseña:</p>
                            <a href="${passwordResetLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #e74c3c; border-radius: 3px; text-decoration: none;">Restablecer Contraseña</a>
                            <p style="font-size: 14px; color: #999; margin-top: 20px;">Si tienes problemas haciendo clic en el botón, copia y pega la URL de abajo en tu navegador web.</p>
                            <p style="font-size: 12px; color: #999; word-break: break-all;">${passwordResetLink}</p>
                            <p style="font-size: 14px; color: #999; margin-top: 20px;">Si no has solicitado restablecer tu contraseña, ignora este correo.</p>
                        </div>`
                    };
                    break;

                case 'welcome':
                    const passwordResetLink2 = await admin.auth().generatePasswordResetLink(email, {
                        url: 'https://solardrone.app',
                        handleCodeInApp: false
                    });
                    mailOptions = {
                        from: "pruebassolardrone@gmail.com",
                        to: email,
                        subject: `¡Bienvenido a Solardrone!`,
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #34495e;">¡Bienvenido a Solardrone!</h2>
                        <p style="font-size: 16px; color: #333;">Estamos emocionados de tenerte a bordo en nuestra plataforma.</p>
                        <hr style="border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 16px; color: #333;">Ya puedes acceder y explorar todas las plantas disponibles para tu empresa. Por favor, crea tu contraseña a través del siguiente enlace:</p>
                        <a href="${passwordResetLink2}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #3498db; border-radius: 3px; text-decoration: none;">Crear mi contraseña</a>
                        <p style="font-size: 14px; color: #999; margin-top: 20px;">Si tienes problemas haciendo clic en el botón, copia y pega la URL de abajo en tu navegador web.</p>
                        <p style="font-size: 12px; color: #999; word-break: break-all;">${passwordResetLink2}</p>
                    </div>`
                    };
                    break;

                case 'welcomeAddedPlant':
                    const passwordResetLink3 = await admin.auth().generatePasswordResetLink(email, {
                        url: 'https://solardrone.app',
                        handleCodeInApp: false
                    });
                    mailOptions = {
                        from: "pruebassolardrone@gmail.com",
                        to: email,
                        subject: 'Bienvenido a Solardrone',
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                            <h2 style="color: #34495e;">¡Bienvenido a Solardrone!</h2>
                            <p style="font-size: 16px; color: #333;">Cuando crees tu contraseña, podrás acceder a nuestra plataforma. Por el momento, te han invitado a la planta "<strong>${customParameters.nombrePlanta}</strong>".</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p style="font-size: 16px; color: #333;">Haz clic en el botón de abajo para crear tu contraseña:</p>
                            <a href="${passwordResetLink3}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #3498db; border-radius: 3px; text-decoration: none;">Crear Contraseña</a>
                            <p style="font-size: 14px; color: #999; margin-top: 20px;">Si tienes problemas haciendo clic en el botón, copia y pega la URL de abajo en tu navegador web.</p>
                            <p style="font-size: 12px; color: #999; word-break: break-all;">${passwordResetLink3}</p>
                        </div>`
                    };
                    break;

                case 'addedPlant':

                    mailOptions = {
                        from: "pruebassolardrone@gmail.com",
                        to: email,
                        subject: `Has sido invitado a la planta "${customParameters.nombrePlanta}" en Solardrone`,
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                            <p style="font-size: 16px; color: #333;">Nos complace informarte que has sido invitado a la planta "${customParameters.nombrePlanta}".</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p style="font-size: 16px; color: #333;">Puedes acceder a la plataforma para ver los detalles y comenzar a trabajar con la planta.</p>
                            <a href="https://solardrone.app" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #2ecc71; border-radius: 3px; text-decoration: none;">Ir a Solardrone</a>
                            <p style="font-size: 14px; color: #999; margin-top: 20px;">Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                        </div>`
                    };
                    break;

                default:
                    // Set response status and content here
                    res.status(400).send('Invalid template');
                    return; // Return early to stop further execution
            }

            // Send the email
            await transporter.sendMail(mailOptions);
            res.status(200).send({ status: 'Email sent' });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al enviar correo: ' + error);
        }
    });
});



