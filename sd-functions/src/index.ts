/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// // import * as functions from 'firebase-functions';
// // import * as admin from 'firebase-admin';

// // admin.initializeApp();

// // export const createUser = functions.https.onCall(async (data, context) => {
// //     const { email, password } = data;

// //     try {
// //         const userRecord = await admin.auth().createUser({ email, password });
// //         return { uid: userRecord.uid };
// //     } catch (error) {
// //         throw new functions.https.HttpsError('internal', 'Error al crear el usuario');
// //     }
// // });

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();

// Configura las opciones de CORS
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