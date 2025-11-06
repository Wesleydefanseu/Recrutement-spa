// import { NextRequest, NextResponse } from 'next/server';
// import { put } from '@vercel/blob';
// import { createPool } from '@vercel/postgres'; 
// import nodemailer from 'nodemailer'; 
// import { Buffer } from 'buffer';

// // --- Configuration des Services ---

// // Vercel Postgres Pool (Initialisation Lazy)
// // Le pool n'est pas créé ici, il est juste déclaré.
// let pool: ReturnType<typeof createPool> | null = null;

// function getDbPool() {
//     // Si le pool n'existe pas encore (première exécution)
//     if (!pool) {
//         // La vérification de POSTGRES_URL est exécutée seulement au Runtime
//         if (!process.env.POSTGRES_URL) {
//             throw new Error("POSTGRES_URL n'est pas défini dans les variables d'environnement.");
//         }
//         // Le pool est créé pour la première et dernière fois
//         pool = createPool({
//             connectionString: process.env.POSTGRES_URL,
//         });
//     }
//     return pool;
// }

// // Configuration Nodemailer
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false, 
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export async function POST(req: NextRequest) {
//     // ÉTAPE CRUCIALE: Initialisation du Pool APRES le début de la requête (Runtime)
//     const currentPool = getDbPool(); 

//     let cvUrl = ''; 
//     let data;

//     try {
//         // 1. TRAITEMENT DES DONNÉES ET FICHIER
//         const formData = await req.formData(); 

//         data = {
//             nom: formData.get('nom') as string,
//             prenom: formData.get('prenom') as string,
//             email: formData.get('email') as string,
//             telephone: formData.get('telephone') as string,
//             // ALIGNEMENT : Assurez-vous que le nom correspond au champ 'name' de votre <select>
//             poste: formData.get('poste_candidature') as string, 
//             message: formData.get('message_candidature') as string,
//         };

//         const cvFile = formData.get('cv_file') as File;
        
//         if (!cvFile || cvFile.size === 0 || !cvFile.name) {
//             return NextResponse.json({ success: false, message: 'Le CV est manquant ou vide.' }, { status: 400 });
//         }
        
//         const fileBuffer = await cvFile.arrayBuffer(); 
//         const nodeBuffer = Buffer.from(fileBuffer);

        
//         // 2. UPLOAD DU CV VERS VERCEL BLOB
//         try {
//             const cvFileName = `${data.nom}_${data.prenom}_${Date.now()}_${cvFile.name}`;
//             const blob = await put(`cvs/${cvFileName}`, nodeBuffer, {
//                 access: 'public', 
//                 contentType: cvFile.type || 'application/pdf',
//             });
//             cvUrl = blob.url;
//             console.log("Blob réussi. URL: ", cvUrl);
//         } catch (error) {
//             console.error('ERREUR BLOB (CODE 500):', error); 
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'upload du CV. Vérifiez la clé BLOB_READ_WRITE_TOKEN.`, 
//             }, { status: 500 });
//         }


//         // 3. ENREGISTREMENT DANS LA BASE DE DONNÉES POSTGRES
//         try {
//             // Utilisation de currentPool.sql
//             await currentPool.sql`
//               INSERT INTO candidatures (nom, prenom, email, telephone, poste, message, cv_url)
//               VALUES (
//                 ${data.nom}, 
//                 ${data.prenom}, 
//                 ${data.email}, 
//                 ${data.telephone}, 
//                 ${data.poste}, 
//                 ${data.message}, 
//                 ${cvUrl}
//               );
//             `;
//             console.log("Postgres réussi.");
//         } catch (error) {
//             console.error('ERREUR POSTGRES (CODE 500):', error);
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'enregistrement en BD. (Vérifiez le mot de passe dans POSTGRES_URL)`, 
//             }, { status: 500 });
//         }


//         // 4. ENVOI DE L'EMAIL DE NOTIFICATION
//         try {
//             const mailOptions = {
//                 from: process.env.SMTP_USER,
//                 to: process.env.EMAIL_RECRUTEMENT,
//                 subject: `[CANDIDATURE SPA] ${data.poste} - ${data.nom} ${data.prenom}`,
//                 html: `
//                     <div style="font-family: Arial, sans-serif;">
//                         <img src="${process.env.URL_LOGO}" alt="Logo Entreprise" style="height: 50px;"><br>
//                         <h2 style="color: #EAC964;">Nouvelle Candidature Reçue</h2>
//                         <p><strong>Poste Visé:</strong> ${data.poste}</p>
//                         <p><strong>Nom Prénom:</strong> ${data.nom} ${data.prenom}</p>
//                         <p><strong>Email:</strong> ${data.email}</p>
//                         <hr>
//                         <p><strong>Télécharger le CV:</strong> <a href="${cvUrl}">${cvUrl}</a></p>
//                     </div>
//                 `,
//             };
//             await transporter.sendMail(mailOptions);
//             console.log("SMTP réussi."); 

//         } catch (error) {
//             console.error('ERREUR SMTP (CODE 500):', error);
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'envoi d'email. Vérifiez les clés SMTP.`, 
//             }, { status: 500 });
//         }

//         // 5. Réponse de Succès Finale
//         return NextResponse.json({ 
//             success: true, 
//             message: `Félicitations ${data.prenom}! Votre candidature a été reçue et enregistrée.` 
//         });

//     } catch (error) {
//         console.error('Erreur du backend (POST - Global):', error);
//         return NextResponse.json({ 
//             success: false, 
//             message: `Une erreur globale s'est produite lors du traitement.`, 
//         }, { status: 500 });
//     }
// }











// import { NextRequest, NextResponse } from 'next/server';
// import { put } from '@vercel/blob';
// import { createPool } from '@vercel/postgres'; 
// import nodemailer from 'nodemailer'; 
// import { Buffer } from 'buffer';

// // --- Configuration des Services ---

// // Vercel Postgres Pool (Initialisation Lazy) - Utilise la méthode nativement supportée par Vercel
// let pool: ReturnType<typeof createPool> | null = null;

// function getDbPool() {
//     // Si le pool n'existe pas encore (première exécution)
//     if (!pool) {
//         if (!process.env.POSTGRES_URL) {
//             throw new Error("POSTGRES_URL n'est pas défini dans les variables d'environnement.");
//         }
//         // Le pool est créé pour la première et dernière fois
//         pool = createPool({
//             connectionString: process.env.POSTGRES_URL,
//         });
//     }
//     return pool;
// }

// // Configuration Nodemailer
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false, // TLS/STARTTLS est utilisé par défaut sur le port 587
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS, // Doit être le mot de passe d'application de 16 caractères
//   },
// });

// export async function POST(req: NextRequest) {
//     // ÉTAPE CRUCIALE: Initialisation du Pool APRES le début de la requête (Runtime)
//     const currentPool = getDbPool(); 

//     let cvUrl = ''; 
//     let data;

//     try {
//         // 1. TRAITEMENT DES DONNÉES ET FICHIER
//         const formData = await req.formData(); 

//         data = {
//             nom: formData.get('nom') as string,
//             prenom: formData.get('prenom') as string,
//             email: formData.get('email') as string,
//             telephone: formData.get('telephone') as string,
//             poste: formData.get('poste_candidature') as string, 
//             message: formData.get('message_candidature') as string,
//         };

//         const cvFile = formData.get('cv_file') as File;
        
//         if (!cvFile || cvFile.size === 0 || !cvFile.name) {
//             return NextResponse.json({ success: false, message: 'Le CV est manquant ou vide.' }, { status: 400 });
//         }
        
//         const fileBuffer = await cvFile.arrayBuffer(); 
//         const nodeBuffer = Buffer.from(fileBuffer);

        
//         // 2. UPLOAD DU CV VERS VERCEL BLOB
//         try {
//             const cvFileName = `${data.nom}_${data.prenom}_${Date.now()}_${cvFile.name}`;
//             const blob = await put(`cvs/${cvFileName}`, nodeBuffer, {
//                 access: 'public', 
//                 contentType: cvFile.type || 'application/pdf',
//             });
//             cvUrl = blob.url;
//             console.log("Blob réussi. URL: ", cvUrl);
//         } catch (error) {
//             console.error('ERREUR BLOB (CODE 500):', error); 
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'upload du CV. Vérifiez la clé BLOB_READ_WRITE_TOKEN.`, 
//             }, { status: 500 });
//         }


//         // 3. ENREGISTREMENT DANS LA BASE DE DONNÉES POSTGRES
//         try {
//             // Utilisation de currentPool.sql (méthode de tag template simple)
//             await currentPool.sql`
//               INSERT INTO candidatures (nom, prenom, email, telephone, poste, message, cv_url)
//               VALUES (
//                 ${data.nom}, 
//                 ${data.prenom}, 
//                 ${data.email}, 
//                 ${data.telephone}, 
//                 ${data.poste}, 
//                 ${data.message}, 
//                 ${cvUrl}
//               );
//             `;
//             console.log("Postgres réussi.");
//         } catch (error) {
//             console.error('ERREUR POSTGRES (CODE 500):', error);
//             // Cette erreur est souvent causée par un mot de passe incorrect dans POSTGRES_URL
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'enregistrement en BD. (Vérifiez le mot de passe dans POSTGRES_URL)`, 
//             }, { status: 500 });
//         }


//         // 4. ENVOI DE L'EMAIL DE NOTIFICATION
//         try {
//             const mailOptions = {
//                 from: process.env.SMTP_USER,
//                 to: process.env.EMAIL_RECRUTEMENT,
//                 subject: `[CANDIDATURE SPA] ${data.poste} - ${data.nom} ${data.prenom}`,
//                 html: `
//                     <div style="font-family: Arial, sans-serif;">
//                         <img src="${process.env.URL_LOGO}" alt="Logo Entreprise" style="height: 50px;"><br>
//                         <h2 style="color: #EAC964;">Nouvelle Candidature Reçue</h2>
//                         <p><strong>Poste Visé:</strong> ${data.poste}</p>
//                         <p><strong>Nom Prénom:</strong> ${data.nom} ${data.prenom}</p>
//                         <p><strong>Email:</strong> ${data.email}</p>
//                         <hr>
//                         <p><strong>Télécharger le CV:</strong> <a href="${cvUrl}">${cvUrl}</a></p>
//                     </div>
//                 `,
//             };
//             await transporter.sendMail(mailOptions);
//             console.log("SMTP réussi."); 

//         } catch (error) {
//             console.error('ERREUR SMTP (CODE 500):', error);
//             return NextResponse.json({ 
//                 success: false, 
//                 message: `Échec de l'envoi d'email. Vérifiez les clés SMTP.`, 
//             }, { status: 500 });
//         }

//         // 5. Réponse de Succès Finale
//         return NextResponse.json({ 
//             success: true, 
//             message: `Félicitations ${data.prenom}! Votre candidature a été reçue et enregistrée.` 
//         });

//     } catch (error) {
//         console.error('Erreur du backend (POST - Global):', error);
//         return NextResponse.json({ 
//             success: false, 
//             message: `Une erreur globale s'est produite lors du traitement.`, 
//         }, { status: 500 });
//     }
// }



import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@vercel/postgres'; // CLÉ: Utilisation de createClient
import nodemailer from 'nodemailer'; 
import { Buffer } from 'buffer';

// --- Configuration des Services ---

// Vercel Postgres Client (Initialisation Lazy)
let client: ReturnType<typeof createClient> | null = null;

function getDbClient() {
    if (!client) {
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL n'est pas défini.");
        }
        // Le client est créé
        client = createClient({
            connectionString: process.env.POSTGRES_URL,
        });
    }
    return client;
}

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Mot de passe d'application correct (kwgzormasjrhpqwo)
  },
});

export async function POST(req: NextRequest) {
    // ÉTAPE CRUCIALE: Initialisation du Client APRES le début de la requête
    const currentClient = getDbClient(); 

    let cvUrl = ''; 
    let data;

    try {
        // 1. TRAITEMENT DES DONNÉES ET FICHIER
        const formData = await req.formData(); 

        data = {
            nom: formData.get('nom') as string,
            prenom: formData.get('prenom') as string,
            email: formData.get('email') as string,
            telephone: formData.get('telephone') as string,
            poste: formData.get('poste_candidature') as string, 
            message: formData.get('message_candidature') as string,
        };

        const cvFile = formData.get('cv_file') as File;
        
        if (!cvFile || cvFile.size === 0 || !cvFile.name) {
            return NextResponse.json({ success: false, message: 'Le CV est manquant ou vide.' }, { status: 400 });
        }
        
        const fileBuffer = await cvFile.arrayBuffer(); 
        const nodeBuffer = Buffer.from(fileBuffer);

        
        // 2. UPLOAD DU CV VERS VERCEL BLOB
        try {
            const cvFileName = `${data.nom}_${data.prenom}_${Date.now()}_${cvFile.name}`;
            const blob = await put(`cvs/${cvFileName}`, nodeBuffer, {
                access: 'public', 
                contentType: cvFile.type || 'application/pdf',
            });
            cvUrl = blob.url;
        } catch (error) {
            console.error('ERREUR BLOB (CODE 500):', error); 
            return NextResponse.json({ 
                success: false, 
                message: `Échec de l'upload du CV. Vérifiez la clé BLOB_READ_WRITE_TOKEN.`, 
            }, { status: 500 });
        }


        // 3. ENREGISTREMENT DANS LA BASE DE DONNÉES POSTGRES
        let connection;
        try {
            // Connexion explicite (nécessaire pour createClient)
            connection = await currentClient.connect(); 

            // CLÉ: Utilisation de la méthode query() standard (pour createClient)
            await connection.query(
                `INSERT INTO candidatures (nom, prenom, email, telephone, poste, message, cv_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [data.nom, data.prenom, data.email, data.telephone, data.poste, data.message, cvUrl]
            );
        } catch (error) {
            console.error('ERREUR POSTGRES (CODE 500):', error);
            return NextResponse.json({ 
                success: false, 
                message: `Échec de l'enregistrement en BD. (Vérifiez POSTGRES_URL)`, 
            }, { status: 500 });
        } finally {
            // Libérer la connexion
            if (connection) {
                connection.release();
            }
        }


        // 4. ENVOI DE L'EMAIL DE NOTIFICATION
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: process.env.EMAIL_RECRUTEMENT,
                subject: `[CANDIDATURE SPA] ${data.poste} - ${data.nom} ${data.prenom}`,
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <img src="${process.env.URL_LOGO}" alt="Logo Entreprise" style="height: 50px;"><br>
                        <h2 style="color: #EAC964;">Nouvelle Candidature Reçue</h2>
                        <p><strong>Poste Visé:</strong> ${data.poste}</p>
                        <p><strong>Nom Prénom:</strong> ${data.nom} ${data.prenom}</p>
                        <p><strong>Télécharger le CV:</strong> <a href="${cvUrl}">${cvUrl}</a></p>
                    </div>
                `,
            };
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('ERREUR SMTP (CODE 500):', error);
            return NextResponse.json({ 
                success: false, 
                message: `Échec de l'envoi d'email. Vérifiez les clés SMTP.`, 
            }, { status: 500 });
        }

        // 5. Réponse de Succès Finale
        return NextResponse.json({ 
            success: true, 
            message: `Félicitations ${data.prenom}! Votre candidature a été reçue et enregistrée.` 
        });

    } catch (error) {
        console.error('Erreur du backend (POST - Global):', error);
        return NextResponse.json({ 
            success: false, 
            message: `Une erreur globale s'est produite lors du traitement.`, 
        }, { status: 500 });
    }
}