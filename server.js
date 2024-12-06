const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const marked = require('marked');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sanidhyakiit:w003TDgfj2mG96He@cluster0.yfsrp.mongodb.net/Elearning';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });

// Course Schema
const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    modules: [
        {
            title: { type: String, required: true },
            topics: [
                {
                    title: { type: String, required: true }
                }
            ]
        }
    ]
});

const Course = mongoose.model('Course', CourseSchema);

// AI Configuration
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Routes

// Fetch all courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find({});
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Fetch course details by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error.message);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// Add new course
app.post('/api/courses', async (req, res) => {
    try {
        console.log('Received course data:', req.body);
        const newCourse = new Course(req.body);
        const savedCourse = await newCourse.save();
        console.log('Saved course:', savedCourse);
        res.status(201).json(savedCourse);
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ error: 'Failed to add course', details: error.message });
    }
});

// Generate AI-powered content
app.post('/api/generate-content', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required.' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Generate a well-structured educational content about ${topic}. 
                        Include a clear introduction, key points, and examples.
                        Use proper markdown syntax for formatting.
                        Ensure proper spacing between paragraphs and sections.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const markdown = response.text();

        // Parse markdown to HTML
        const html = marked.parse(markdown);

        // Wrap the HTML content in a div for styling purposes
        const wrappedHtml = `
            <div class="ai-generated-content">
                ${html}
            </div>
        `;

        res.json({ content: wrappedHtml });
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            details: error.message
        });
    }
});

// Add this route before the catch-all route
app.get('/course/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'course_page.html'));
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/course/')) {
        res.sendFile(path.join(__dirname, 'public', 'home.html'));
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

