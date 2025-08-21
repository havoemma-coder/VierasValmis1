import { Resend } from 'resend';

// Haetaan API-avain ympäristömuuttujista. Oikeassa projektissa tämä
// asetettaisiin palveluntarjoajan (esim. Vercel, Netlify) asetuksissa.
const resend = new Resend(process.env.RESEND_API_KEY);

// Hinnat per neliömetri
const hinnat = {
    Pika: 1.20,
    Perus: 1.60,
    Täysi: 2.10
};

// Tämä on serverless-funktion pääkäsittelijä
export default async function handler(request, response) {
    // Varmistetaan, että pyyntö on POST-pyyntö
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Luetaan lomakkeen tiedot pyynnön bodysta
        const data = request.body;

        // Lasketaan hinta-arvio uudelleen turvallisuussyistä palvelimella
        const hinta = (parseFloat(data.nelio) * hinnat[data.paketti]).toFixed(2);

        // --- Tässä luodaan siivoojan "Työkortti" HTML-muodossa ---
        const emailHtml = `
            <style>
                body { font-family: sans-serif; }
                .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; }
                h1 { color: #3A5A40; }
                strong { color: #3A5A40; }
            </style>
            <div class="card">
                <h1>Uusi siivouskeikka!</h1>
                <p><strong>Asiakas:</strong> ${data.nimi}</p>
                <p><strong>Sähköposti:</strong> ${data.email}</p>
                <p><strong>Puhelin:</strong> ${data.puhelin}</p>
                <hr>
                <p><strong>Kohde:</strong> ${data.osoite}</p>
                <p><strong>Ajankohta:</strong> ${data.paiva}, ${data.aikaikkuna}</p>
                <hr>
                <p><strong>Paketti:</strong> VierasValmis ${data.paketti.toUpperCase()}</p>
                <p><strong>Neliöt:</strong> ${data.nelio} m²</p>
                <p><strong>Hinta-arvio:</strong> ${hinta} €</p>
                <hr>
                <h3>Sisäänpääsyohjeet:</h3>
                <p>${data.ohjeet}</p>
            </div>
        `;

        // Lähetetään sähköposti käyttäen Resend-palvelua
        await resend.emails.send({
            from: 'VierasValmis <onboarding@resend.dev>', // Käytetään Resendin testiosoitetta, joka ei vaadi verifiointia
            to: ['emma@havot.net'],
            subject: `Uusi siivouskeikka: ${data.osoite} - ${data.paiva}`,
            html: emailHtml,
        });

        // Lähetetään onnistumisvastaus takaisin verkkosivulle
        return response.status(200).json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error(error);
        // Lähetetään virhevastaus takaisin verkkosivulle
        return response.status(500).json({ error: 'Something went wrong' });
    }
}
