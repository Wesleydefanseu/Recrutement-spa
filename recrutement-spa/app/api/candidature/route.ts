import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer'; 
import { Buffer } from 'buffer'; // Import nécessaire pour la conversion ArrayBuffer -> Buffer

// --- Configuration Nodemailer ---
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
    
    try {
        // 1. TRAITEMENT DES DONNÉES ET FICHIER (Méthode moderne Next.js)
        // Récupère toutes les données du formulaire (champs texte et fichier)
        const formData = await req.formData(); 

        const data = {
            nom: formData.get('nom') as string,
            prenom: formData.get('prenom') as string,
            email: formData.get('email') as string,
            telephone: formData.get('telephone') as string,
            poste: formData.get('poste_candidature') as string,
            message: formData.get('message_candidature') as string,
        };

        const cvFile = formData.get('cv_file') as File;
        
        // Validation essentielle du fichier
        if (!cvFile || cvFile.size === 0 || !cvFile.name) {
            return NextResponse.json({ success: false, message: 'Le CV est manquant ou vide.' }, { status: 400 });
        }
        
        // Convertir le fichier (de type File) en ArrayBuffer, puis en Node.js Buffer
        const fileBuffer = await cvFile.arrayBuffer(); 
        const nodeBuffer = Buffer.from(fileBuffer);

        // 2. UPLOAD DU CV VERS VERCEL BLOB
        const cvFileName = `${data.nom}_${data.prenom}_${Date.now()}_${cvFile.name}`;
        const blob = await put(`cvs/${cvFileName}`, nodeBuffer, {
          access: 'public', 
          contentType: cvFile.type || 'application/pdf',
        });
        const cvUrl = blob.url; // L'URL publique du CV

        // 3. ENREGISTREMENT DANS LA BASE DE DONNÉES POSTGRES
        await sql`
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

        // 4. ENVOI DE L'EMAIL DE NOTIFICATION
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

        // 5. Réponse de Succès
        return NextResponse.json({ 
            success: true, 
            message: `Félicitations ${data.prenom}! Votre candidature a été reçue et enregistrée.` 
        });

    } catch (error) {
        console.error('Erreur du backend (POST):', error);
        return NextResponse.json({ 
            success: false, 
            message: "Une erreur interne est survenue lors du traitement de la candidature. (Vérifiez la connexion BD/Blob/SMTP)", 
            error: (error as Error).message 
        }, { status: 500 });
    }
}