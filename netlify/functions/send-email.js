import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const hinnat = {
    Pika: 1.20,
    Perus: 1.60,
    Täysi: 2.10
};

export default async (request, context) => {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const data = await request.json();

        const pakettiNimi = data.paketti || '';
        const neliot = parseFloat(data.nelio) || 0;
        const hinta = (neliot * (hinnat[pakettiNimi] || 0)).toFixed(2);

        // --- Sähköposti 1: Työkortti siivoojalle (sinulle) ---
        const cleanerEmailHtml = `
            <style>
                body { font-family: sans-serif; }
                .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; }
                h1 { color: #3A5A40; }
                strong { color: #3A5A40; }
            </style>
            <div class="card">
                <h1>Uusi siivouskeikka!</h1>
                <p><strong>Asiakas:</strong> ${data.nimi || '-'}</p>
                <p><strong>Sähköposti:</strong> ${data.email || '-'}</p>
                <p><strong>Puhelin:</strong> ${data.puhelin || '-'}</p>
                <hr>
                <p><strong>Kohde:</strong> ${data.osoite || '-'}</p>
                <p><strong>Ajankohta:</strong> ${data.paiva || '-'}, ${data.aikaikkuna || '-'}</p>
                <hr>
                <p><strong>Paketti:</strong> VierasValmis ${pakettiNimi ? pakettiNimi.toUpperCase() : 'EI MÄÄRITETTY'}</p>
                <p><strong>Neliöt:</strong> ${neliot > 0 ? neliot + ' m²' : '-'}</p>
                <p><strong>Hinta-arvio:</strong> ${hinta} €</p>
                <hr>
                <h3>Sisäänpääsyohjeet:</h3>
                <p>${data.ohjeet || '-'}</p>
            </div>
        `;

        // --- Sähköposti 2: Vahvistus asiakkaalle ---
        const customerEmailHtml = `
            <style>
                body { font-family: sans-serif; }
                .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; }
                h1 { color: #3A5A40; }
            </style>
            <div class="card">
                <h1>Kiitos tilauksestasi, ${data.nimi || ''}!</h1>
                <p>Olemme vastaanottaneet siivoustilauksesi ja se on nyt käsittelyssä. Saat pian henkilökohtaisen vahvistuksen siivoojalta.</p>
                <h3>Yhteenveto tilauksestasi:</h3>
                <ul>
                    <li><strong>Kohde:</strong> ${data.osoite || '-'}</li>
                    <li><strong>Päivä:</strong> ${data.paiva || '-'}</li>
                    <li><strong>Paketti:</strong> VierasValmis ${pakettiNimi || '-'}</li>
                    <li><strong>Hinta-arvio:</strong> ${hinta} €</li>
                </ul>
                <p>Ystävällisin terveisin,<br>VierasValmis-tiimi</p>
            </div>
        `;

        // Lähetetään molemmat sähköpostit samanaikaisesti
        await Promise.all([
            // Sähköposti siivoojalle
            resend.emails.send({
                from: 'VierasValmis <onboarding@resend.dev>',
                to: ['havo.emma@gmail.com'],
                subject: `Uusi siivouskeikka: ${data.osoite || 'Tuntematon kohde'} - ${data.paiva || 'Tuntematon pvm'}`,
                html: cleanerEmailHtml,
            }),
            // Sähköposti asiakkaalle
            resend.emails.send({
                from: 'VierasValmis <onboarding@resend.dev>',
                to: [data.email], // Asiakkaan sähköposti
                subject: `Vahvistus tilauksestasi - VierasValmis`,
                html: customerEmailHtml,
            })
        ]);

        return new Response(JSON.stringify({ message: 'Emails sent successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Detailed error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
