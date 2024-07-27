document.getElementById('newsletterForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/send-newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        const result = await response.json();
        document.getElementById('messageSent').textContent = result.message;
        document.getElementById('messageSent').style.display = 'block';
    } catch (error) {
        console.error('Error sending newsletter:', error);
    }
});
