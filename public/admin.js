const messageSentStyle = document.getElementById('messageSent').style;

document.getElementById('messageForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/send-newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject: subject, message: message })
        });

        const result = await response.json();
        messageSentStyle.display = 'block';

        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

    } catch (error) {
        console.error('Error sending newsletter:', error);
    }
});

document.getElementById('subject').addEventListener('click', () => {
    messageSentStyle.display = 'none';
})

document.getElementById('message').addEventListener('click', () => {
    messageSentStyle.display = 'none';
})

