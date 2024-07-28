import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { SNSClient, SubscribeCommand, PublishCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';
import { createObjectCsvWriter } from 'csv-writer';
import { CronJob } from 'cron';
import NewsAPI from 'newsapi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000; // change port to http 80

// Create SNS client
const snsClient = new SNSClient({ region: 'us-east-1' });
const topicArn = 'arn:aws:sns:us-east-1:058264182426:SeaNewsletter';

// Create NewsAPI client
const newsapi = new NewsAPI(process.env.NEWSAPI_KEY);
let currentPage = 1;

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

// Function to get the number of subscribers
async function getSubscriberCount() {
    try {
        const data = await snsClient.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
        const activeSubscriptions = data.Subscriptions.filter(subscription => subscription.SubscriptionArn != 'Deleted');
        return activeSubscriptions.length;
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return 0; // Return 0 if there was an error
    }
}

// Function to fetch and send news
async function fetchAndSendNews() {
    try {
        const subscriberCount = await getSubscriberCount();
        if (subscriberCount === 0) {
            console.log('No subscribers to send news to.');
            return; // Exit if there are no subscribers
        }

        const response = await newsapi.v2.topHeadlines({
            country: 'in',
            category: 'general',
            pageSize: 1,
            page: currentPage
        });

        const articles = response.articles;
        if (!articles.length) {
            console.log('No news articles found.');
            return; // Exit if no articles are found
        }

        let message = 'Latest News:\n\n';
        articles.forEach((article, index) => {
            message += `${article.title}\n${article.url}\n\n`;
        });

        const params = {
            TopicArn: topicArn,
            Message: message,
            Subject: 'Latest News'
        };

        const data = await snsClient.send(new PublishCommand(params));
        console.log('Newsletter sent successfully:', data);

        currentPage++;

    } catch (error) {
        console.error('Error sending newsletter:', error);
    }
}

const job = new CronJob('* * * * *', fetchAndSendNews); // Every minute
job.start();
