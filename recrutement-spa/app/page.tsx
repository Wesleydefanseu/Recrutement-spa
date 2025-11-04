// app/page.tsx
// Note: Laissez 'use client' si votre page utilise des hooks (comme useState)
'use client'; 

export default function TestPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>200 OK - LA PAGE A CHARGÉ</h1>
      <p>La configuration du déploiement est maintenant correcte.</p>
    </div>
  );
}


// 'use client'; 

// import React, { useState } from 'react';

// // Les postes à pourvoir que vous avez spécifiés
// const postes = [
//     "Coiffeur", 
//     "Coiffeuse",
//     "Esthéticienne",
//     "Prothésiste ongulaire", 
// ];

// export default function CandidatureForm() {
//     // État pour gérer l'affichage des messages (info, chargement, succès, erreur)
//     const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
//     const [message, setMessage] = useState('');

//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
        
//         setStatus('loading');
//         setMessage('Envoi en cours... Veuillez patienter.');

//         // Crée l'objet FormData qui inclut les champs texte et le fichier CV
//         const formData = new FormData(event.currentTarget);
        
//         // Validation simple du fichier
//         const cvFile = formData.get('cv_file') as File;
//         if (!cvFile || cvFile.size === 0) {
//             setStatus('error');
//             setMessage('Veuillez joindre votre CV.');
//             return;
//         }

//         try {
//             // Envoi à la Serverless Function à l'URL /api/candidature
//             const response = await fetch('/api/candidature', {
//                 method: 'POST',
//                 body: formData, // FormData gère l'envoi du fichier et des champs
//             });

//             const result = await response.json();
            
//             if (response.ok && result.success) {
//                 setStatus('success');
//                 setMessage(result.message);
//                 event.currentTarget.reset(); // Réinitialise le formulaire après succès
//             } else {
//                 // Erreur renvoyée par le backend
//                 throw new Error(result.message || "Erreur de serveur inconnue.");
//             }
//         } catch (error) {
//             setStatus('error');
//             setMessage(`Échec de l'envoi : Le serveur n'a pas pu traiter votre demande. Détail: ${(error as Error).message}`);
//             console.error(error);
//         }
//     };

//     return (
//         <div className="main-content-wrapper">
//             <h1>Candidature Sunshine Spa & Beauty</h1>
//             <p>Veuillez remplir le formulaire ci-dessous pour postuler à un poste.</p>
            
//             <form onSubmit={handleSubmit} id="candidatureForm" className="recruitment-form">
                
//                 {/* 1. Coordonnées */}
//                 <div className="input-group">
//                     <label htmlFor="nom">Nom *</label>
//                     <input type="text" id="nom" name="nom" required />
//                 </div>
//                 <div className="input-group">
//                     <label htmlFor="prenom">Prénom *</label>
//                     <input type="text" id="prenom" name="prenom" required />
//                 </div>
//                 <div className="input-group">
//                     <label htmlFor="email">Email *</label>
//                     <input type="email" id="email" name="email" required />
//                 </div>
//                 <div className="input-group">
//                     <label htmlFor="telephone">Téléphone *</label>
//                     <input type="tel" id="telephone" name="telephone" required />
//                 </div>

//                 {/* 2. Poste à pourvoir */}
//                 <div className="input-group full-width">
//                     <label htmlFor="poste">Poste Candidaté *</label>
//                     <select id="poste" name="poste_candidature" required defaultValue="">
//                         <option value="" disabled>Choisissez le poste visé...</option>
//                         {postes.map(p => (
//                             <option key={p} value={p}>{p}</option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* 3. CV */}
//                 <div className="input-group full-width file-group">
//                     <label htmlFor="cv">Joindre votre CV (PDF/DOCX) *</label>
//                     <input type="file" id="cv" name="cv_file" accept=".pdf,.doc,.docx" required />
//                 </div>
                
//                 {/* 4. Message */}
//                 <div className="input-group full-width">
//                     <label htmlFor="message">Lettre de motivation / Message</label>
//                     <textarea id="message" name="message_candidature" rows={4} placeholder="Décrivez votre expérience ou votre motivation..."></textarea>
//                 </div>

//                 {/* Bouton de soumission */}
//                 <button type="submit" disabled={status === 'loading'} className="gold-button">
//                     {status === 'loading' ? 'Envoi...' : 'Envoyer ma Candidature'}
//                 </button>
//             </form>

//             {/* Affichage du statut */}
//             {message && (
//                 <div className={`message-validation ${status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}`}>
//                     {message}
//                 </div>
//             )}
//         </div>
//     );
// }