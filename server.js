import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { SNSClient, SubscribeCommand, PublishCommand } from '@aws-sdk/client-sns';

// Determine __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Create SNS client
const snsClient = new SNSClient({ region: 'ap-south-1' });
const topicArn = 'arn:aws:sns:ap-south-1:058264182426:newsletterService';  // Replace with your Topic ARN

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route for the subscription form
app.post('/subscribe', async (req, res) => {
    const email = req.body.email;
    const params = {
        Protocol: 'EMAIL',
        TopicArn: topicArn,
        Endpoint: email
    };
    
    try {
        const data = await snsClient.send(new SubscribeCommand(params));
        res.status(200).json({ message: 'Subscription successful! Check your email to confirm.' });
    } catch (error) {
        res.status(500).json({ message: 'Subscription failed lol.', error });
    }
});

// Route for the admin newsletter form
app.post('/send-newsletter', async (req, res) => {
    const message = req.body.message;
    const params = {
        TopicArn: topicArn,
        Message: message,
        Subject: 'Newsletter'
    };
    
    try {
        const data = await snsClient.send(new PublishCommand(params));
        res.status(200).json({ message: 'Newsletter sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Sending newsletter failed.', error });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
