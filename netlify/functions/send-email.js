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
        console.log('Successfully parsed data:', data);

        const pakettiNimi = data.paketti || '';
        const neliot = parseFloat(data.nelio) || 0;
        const hinta = (neliot * (hinnat[pakettiNimi] || 0)).toFixed(2);

        // Tarkistetaan, onko kohteessa imuri ja luodaan siitä erillinen HTML-pätkä.
        const imuriInfo = data.oma_imuri === 'kylla' ? '<hr><p><strong>Lisätieto:</strong> Kohteessa on imuri.</p>' : '';

        const emailHtml = `
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
                ${imuriInfo}
            </div>
        `;

        await resend.emails.send({
            from: 'VierasValmis <onboarding@resend.dev>',
            to: ['havo.emma@gmail.com'],
            subject: `Uusi siivouskeikka: ${data.osoite || 'Tuntematon kohde'} - ${data.paiva || 'Tuntematon pvm'}`,
            html: emailHtml,
        });

        return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
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