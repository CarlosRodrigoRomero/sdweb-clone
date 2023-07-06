// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// admin.initializeApp();

// exports.createUser = functions.https.onCall(async (data, context) => {
//     const { email, password } = data;

//     try {
//         // Crear el usuario en Firebase Authentication
//         const userRecord = await admin.auth().createUser({
//             email,
//             password,
//         });

//         // // Opcionalmente, crear un registro en Firestore
//         // await admin.firestore().collection("users").doc(userRecord.uid).set({
//         //     email,
//         //     // Otros campos que quieras guardar
//         // });

//         return { success: true };
//     } catch (error) {
//         return { error: error.message };
//     }
// });