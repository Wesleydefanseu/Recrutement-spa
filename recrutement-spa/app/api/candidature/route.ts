import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createPool } from '@vercel/postgres'; 
import nodemailer from 'nodemailer'; 
import { Buffer } from 'buffer';

// --- Configuration des Services ---

// Vercel Postgres Pool (Initialisation Lazy)
// Le pool n'est pas créé ici, il est juste déclaré.
let pool: ReturnType<typeof createPool> | null = null;

function getDbPool() {
    // Si le pool n'existe pas encore (première exécution)
    if (!pool) {
        // La vérification de POSTGRES_URL est exécutée seulement au Runtime
        if (!process.env.POSTGRES_URL) {
            throw new Error("POSTGRES_URL n'est pas défini dans les variables d'environnement.");
        }
        // Le pool est créé pour la première et dernière fois
        pool = createPool({
            connectionString: process.env.POSTGRES_URL,
        });
    }
    return pool;
}

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
    // ÉTAPE CRUCIALE: Initialisation du Pool APRES le début de la requête (Runtime)
    const currentPool = getDbPool(); 

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
            // ALIGNEMENT : Assurez-vous que le nom correspond au champ 'name' de votre <select>
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
            console.log("Blob réussi. URL: ", cvUrl);
        } catch (error) {
            console.error('ERREUR BLOB (CODE 500):', error); 
            return NextResponse.json({ 
                success: false, 
                message: `Échec de l'upload du CV. Vérifiez la clé BLOB_READ_WRITE_TOKEN.`, 
            }, { status: 500 });
        }


        // 3. ENREGISTREMENT DANS LA BASE DE DONNÉES POSTGRES
        try {
            // Utilisation de currentPool.sql
            await currentPool.sql`
              INSERT INTO candidatures (nom, prenom, email, telephone, poste, message, cv_url)
              VALUES (
                ${data.nom}, 
                ${data.prenom}, 
                ${data.email}, 
                ${data.telephone}, 
                ${data.poste}, 
                ${data.message}, 
                ${cvUrl}
              );
            `;
            console.log("Postgres réussi.");
        } catch (error) {
            console.error('ERREUR POSTGRES (CODE 500):', error);
            return NextResponse.json({ 
                success: false, 
                message: `Échec de l'enregistrement en BD. (Vérifiez le mot de passe dans POSTGRES_URL)`, 
            }, { status: 500 });
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
                        <p><strong>Email:</strong> ${data.email}</p>
                        <hr>
                        <p><strong>Télécharger le CV:</strong> <a href="${cvUrl}">${cvUrl}</a></p>
                    </div>
                `,
            };
            await transporter.sendMail(mailOptions);
            console.log("SMTP réussi."); 

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