import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { SNSClient, SubscribeCommand, PublishCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 80; // change port to http 80

// Create SNS client
const snsClient = new SNSClient({ region: 'us-east-1' });
const topicArn = 'arn:aws:sns:us-east-1:058264182426:SeaNewsletter';

const csvWriter = createObjectCsvWriter({
    path: 'subscribers.csv',
    header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' }
    ],
    append: true 
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route for the subscription form
app.post('/subscribe', async (req, res) => {
    const { name, email } = req.body;
    const params = {
        Protocol: 'EMAIL',
        TopicArn: topicArn,
        Endpoint: email
    };
    
    try {
        const data = await snsClient.send(new SubscribeCommand(params));

        await csvWriter.writeRecords([{ name, email }]);

        res.status(200).json({ message: 'Subscription successful! Check your email to confirm.' });
    } catch (error) {
	console.error('Subscription error:', error);
        res.status(500).json({ message: 'Subscription failed lol.', error });
    }
});

// Route for the admin newsletter form
app.post('/send-newsletter', async (req, res) => {
    const { subject, message } = req.body;
    const params = {
        TopicArn: topicArn,
        Message: message,
        Subject: subject
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
