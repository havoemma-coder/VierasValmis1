document.addEventListener('DOMContentLoaded', function() {
    // --- DOM-elementit ---
    const form = document.getElementById('tilaus-lomake');
    const kiitosViesti = document.getElementById('kiitos-viesti');
    const submitButton = form.querySelector('button[type="submit"]');
    const neliotInput = document.getElementById('nelio');
    const pakettiSelect = document.getElementById('paketti');
    const hintaDiv = document.getElementById('laskettu-hinta');
    const kestoDiv = document.getElementById('laskettu-kesto');
    const aikaAlkaaInput = document.getElementById('aika-alkaa');
    const aikaLoppuuInput = document.getElementById('aika-loppuu');
    const aikaVirheDiv = document.getElementById('aika-virhe');

    // --- Laskennan asetukset ---
    const hinnat = { Pika: 1.20, Perus: 1.60, Täysi: 2.10 };
    const kestoKaava = { Pika: 0.6, Perus: 0.9, Täysi: 1.2 };
    let vaadittuKestoMinuutteina = 0;

    // --- Funktiot ---

    function paivitaYhteenveto() {
        const neliot = parseFloat(neliotInput.value) || 0;
        const valittuPaketti = pakettiSelect.value;

        if (neliot > 0 && valittuPaketti) {
            // Laske ja näytä hinta
            const hinta = neliot * hinnat[valittuPaketti];
            hintaDiv.textContent = hinta.toFixed(2) + ' €';

            // Laske, pyöristä ja näytä kesto
            const laskettuKesto = neliot * kestoKaava[valittuPaketti];
            vaadittuKestoMinuutteina = Math.round(laskettuKesto / 10) * 10;
            const tunnit = Math.floor(vaadittuKestoMinuutteina / 60);
            const minuutit = vaadittuKestoMinuutteina % 60;
            kestoDiv.textContent = `${tunnit > 0 ? tunnit + ' h' : ''} ${minuutit > 0 ? minuutit + ' min' : ''}`.trim() || '-';

        } else {
            hintaDiv.textContent = '-';
            kestoDiv.textContent = '-';
            vaadittuKestoMinuutteina = 0;
        }
        validoiAikaikkuna(); // Tarkista aikaikkuna aina kun yhteenveto päivittyy
    }

    function validoiAikaikkuna() {
        const alkuAika = aikaAlkaaInput.value;
        const loppuAika = aikaLoppuuInput.value;

        if (!alkuAika || !loppuAika || vaadittuKestoMinuutteina === 0) {
            aikaVirheDiv.style.display = 'none';
            submitButton.disabled = false;
            return true;
        }

        const alkuMinuutteina = parseInt(alkuAika.split(':')[0]) * 60 + parseInt(alkuAika.split(':')[1]);
        const loppuMinuutteina = parseInt(loppuAika.split(':')[0]) * 60 + parseInt(loppuAika.split(':')[1]);
        const valittuKesto = loppuMinuutteina - alkuMinuutteina;

        if (valittuKesto < vaadittuKestoMinuutteina) {
            const tunnit = Math.floor(vaadittuKestoMinuutteina / 60);
            const minuutit = vaadittuKestoMinuutteina % 60;
            aikaVirheDiv.textContent = `Valitsemasi aikaikkuna on liian lyhyt. Tarvitsemme vähintään ${tunnit > 0 ? tunnit + ' h' : ''} ${minuutit > 0 ? minuutit + ' min' : ''}.`;
            aikaVirheDiv.style.display = 'block';
            submitButton.disabled = true;
            return false;
        } else {
            aikaVirheDiv.style.display = 'none';
            submitButton.disabled = false;
            return true;
        }
    }

    // --- Tapahtumankäsittelijät ---
    neliotInput.addEventListener('input', paivitaYhteenveto);
    pakettiSelect.addEventListener('change', paivitaYhteenveto);
    aikaAlkaaInput.addEventListener('change', validoiAikaikkuna);
    aikaLoppuuInput.addEventListener('change', validoiAikaikkuna);

    // --- Lomakkeen lähetys ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validoiAikaikkuna()) {
            alert('Tarkista siivoukselle varattu aikaikkuna.');
            return;
        }

        let formIsValid = true;
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                formIsValid = false;
                field.style.borderColor = 'red';
            } else {
                field.style.borderColor = '#ccc';
            }
        });

        if (!formIsValid) {
            alert('Täytä kaikki tähdellä (*) merkityt kentät.');
            return;
        }

        submitButton.textContent = 'Lähetetään...';
        submitButton.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                document.querySelector('.tilaa-wrapper').style.display = 'none';
                kiitosViesti.style.display = 'block';
            } else {
                const errorText = await response.text();
                throw new Error(`Palvelin vastasi virheellä: ${response.status}. ${errorText}`);
            }
        } catch (error) {
            alert('Lähetys epäonnistui. Tekninen virhe:\n\n' + error.message);
            submitButton.textContent = 'Lähetä tilaus';
            submitButton.disabled = false;
        }
    });
});