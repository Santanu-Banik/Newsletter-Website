document.getElementById('subscriptionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();
        document.getElementById('messageSent').textContent = result.message;
        document.getElementById('messageSent').style.display = 'block';
    } catch (error) {
        console.error('Error subscribing:', error);
    }
});
