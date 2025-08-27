document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tilaus-lomake');
    const kiitosViesti = document.getElementById('kiitos-viesti');
    const submitButton = form.querySelector('button[type="submit"]');

    // --- Hintalaskurin elementit ---
    const neliotInput = document.getElementById('nelio');
    const pakettiSelect = document.getElementById('paketti');
    const hintaPlaceholder = document.querySelector('.hinta-placeholder');
    const laskettuHintaDiv = document.getElementById('laskettu-hinta');

    const hinnat = {
        Pika: 1.20,
        Perus: 1.60,
        Täysi: 2.10
    };

    function laskeJaNaytaHinta() {
        const neliot = parseFloat(neliotInput.value);
        const valittuPaketti = pakettiSelect.value;

        if (neliot > 0 && valittuPaketti && hinnat[valittuPaketti]) {
            const hinta = neliot * hinnat[valittuPaketti];
            laskettuHintaDiv.textContent = hinta.toFixed(2) + ' €';
            hintaPlaceholder.style.display = 'none';
            laskettuHintaDiv.style.display = 'block';
        } else {
            laskettuHintaDiv.textContent = '-';
            hintaPlaceholder.style.display = 'block';
        }
    }

    // --- Tapahtumankäsittelijät ---
    neliotInput.addEventListener('input', laskeJaNaytaHinta);
    pakettiSelect.addEventListener('change', laskeJaNaytaHinta);

    // --- Lomakkeen lähetys ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        let formIsValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
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
                headers: {
                    'Content-Type': 'application/json',
                },
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
