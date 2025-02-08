const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const marked = require('marked');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MarkdownIt = require('markdown-it');

const app = express();
const md = new MarkdownIt();
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

// Course Schema with course_code
const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    course_code: {
        type: String,
        required: true,
        unique: true
    },
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

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    organization: { type: String },
    password: { type: String, required: true },
    photo: { type: String, default: null }, // URL or base64 encoded string for photo DP
    enrolledCourses: [
        {
            courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            progress: { type: Number, default: 0 }, // Progress in percentage
        }
    ],
    rewardCoins: { type: Number, default: 0 }, // Coins earned
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);


// PaidCourse Schema
const PaidCourseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    modules: [
        {
            title: { type: String, required: true },
            topics: [
                {
                    title: { type: String, required: true },
                    content: { type: String, required: true }, // Markdown/HTML content
                    video: { type: String }, // Video link
                    notes: { type: String }, // Notes link
                    images: [{ type: String }], // Array of image URLs
                },
            ],
        },
    ],
    description: { type: String, required: true },
    price: { type: Number, required: true },
    dates: { start: Date, end: Date },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    thumbnail: { type: String, required: true },
    headerback: { type: String, required: true },
    languages: [{ type: String, required: true }],
    keySkills: [{ type: String, required: true }],
});

const PaidCourse = mongoose.model('PaidCourse', PaidCourseSchema);




// AI Configuration
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Routes

// Fetch course details by MongoDB _id
app.get('/api/courses/by-id/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id); // Match MongoDB's _id
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error.message);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});



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

// Fetch course details by course_code
app.get('/api/courses/:course_code', async (req, res) => {
    try {
        const course = await Course.findOne({ course_code: req.params.course_code });
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
// Add new course
app.post('/api/courses', async (req, res) => {
    try {
        // Ensure that the course_code is unique
        const { course_code } = req.body;
        const existingCourse = await Course.findOne({ course_code });
        if (existingCourse) {
            return res.status(400).json({ error: 'Course code must be unique' });
        }

        const newCourse = new Course(req.body);
        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ error: 'Failed to add course', details: error.message });
    }
});

// Delete course by ID
// Delete course by course_code
app.delete('/api/courses/:course_code', async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({ course_code: req.params.course_code });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error.message);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});


// Update course
// Update course by course_code
app.put('/api/courses/:course_code', async (req, res) => {
    try {
        const updatedCourse = await Course.findOneAndUpdate(
            { course_code: req.params.course_code }, // Find by course_code
            req.body,
            { new: true } // Return the updated course
        );

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// User Signup
app.post('/api/signup', async (req, res) => {
    const { name, email, organization, phone, password } = req.body;

    try {

        const newUser = new User({ name, email, organization, phone, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// User Login
// User Login (Plain Text Passwords)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare passwords directly
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Failed to login user' });
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


// Route to fetch exclusive courses
app.get('/api/paid-courses', async (req, res) => {
    try {
        console.log('Fetching exclusive courses...');
        const courses = await PaidCourse.find({});
        console.log(`Fetched ${courses.length} courses`);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching exclusive courses:', error.message);
        res.status(500).json({ error: 'Failed to fetch exclusive courses' });
    }
});


app.get('/api/paid-courses/by-id/:id', async (req, res) => {
    const { id } = req.params; // Extract course ID from the route parameters

    try {
        // Validate the ID format (if using MongoDB, check for a valid ObjectId)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid course ID format' });
        }

        // Fetch the course by ID
        const course = await PaidCourse.findById(id);

        // Check if the course exists
        if (!course) {
            return res.status(404).json({ error: 'Paid course not found' });
        }

        // Format each topic to include combined markdown content and images
        course.modules.forEach(module => {
            module.topics.forEach(topic => {
                // Convert markdown content to HTML
                const markdown = topic.content || 'No content available for this topic.';
                const htmlContent = md.render(markdown);

                // Append images to the content
                const imagesHtml = (topic.images || [])
                    .map(imgUrl => `<img src="${imgUrl}" alt="Topic Image" style="max-width: 100%; margin-bottom: 15px;">`)
                    .join('');

                // Combine markdown HTML and images
                topic.formattedContent = `
                    <div class="topic-content">
                        ${htmlContent}
                        <div class="images-section">
                            ${imagesHtml || '<p>No images available for this topic.</p>'}
                        </div>
                    </div>
                `;
            });
        });

        // Respond with the formatted course data
        res.json(course);
    } catch (error) {
        console.error('Error fetching paid course:', error.message);

        // Return a more detailed error message for debugging (optional)
        res.status(500).json({
            error: 'An error occurred while fetching the paid course',
            message: error.message, // Remove in production for security
        });
    }
});

// Route to fetch related paid courses based on key skills
app.get('/api/related-paid-courses/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Validate course ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid course ID format' });
        }

        // Find the current course
        const currentCourse = await Course.findById(id);
        if (!currentCourse) {
            return res.status(404).json({ error: 'Current course not found' });
        }

        // Find related paid courses by key skills
        const relatedCourses = await PaidCourse.find({
            keySkills: { $in: currentCourse.keySkills }, // Match any skill
        });

        // Handle case when no related courses are found
        if (relatedCourses.length === 0) {
            return res.status(404).json({ error: 'No related paid courses found' });
        }

        // Respond with the related courses
        res.json(relatedCourses);
    } catch (error) {
        console.error('Error fetching related paid courses:', error.message);
        res.status(500).json({
            error: 'Failed to fetch related paid courses',
            message: error.message, // Optional: Include in debug mode only
        });
    }
});



// Fetch user's coin balance
app.get('/api/user/:id/coins', async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch user from database
        const user = await User.findById(userId, 'rewardCoins');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ rewardCoins: user.rewardCoins });
    } catch (error) {
        console.error('Error fetching user coins:', error.message);
        res.status(500).json({ error: 'Failed to fetch user coins' });
    }
});



// Serve the addcourse.html file
app.get('/addcourse', (req, res) => {
    console.log("Request for addcourse.html received.");
    res.sendFile(path.join(__dirname, 'public', 'addcourse.html'), (err) => {
        if (err) {
            console.error("Error serving file:", err);
            res.status(500).send('Something went wrong!');
        }
    });
});



app.post('/api/process-payment', async (req, res) => {
    try {
        const { courseId, userId } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        // Get user and course
        const [user, course] = await Promise.all([
            User.findById(userId),
            PaidCourse.findById(courseId)
        ]);

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!course) return res.status(404).json({ error: 'Course not found' });

        // Check balance
        if (user.rewardCoins < course.price) {
            return res.status(400).json({ error: 'Insufficient coins' });
        }

        // Check if already purchased
        const alreadyPurchased = user.enrolledCourses.some(c => c.courseId.equals(course._id));
        if (alreadyPurchased) {
            return res.status(400).json({ error: 'Course already purchased' });
            
            
        }

        // Process payment
        user.rewardCoins -= course.price;
        user.enrolledCourses.push({
            courseId: course._id,
            progress: 0
        });

        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/:id/add-coins', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.rewardCoins += req.body.coins;
        await user.save();

        res.json({
            success: true,
            newCoins: user.rewardCoins
        });
    } catch (error) {
        res.status(500).json({ error: 'Coin update failed' });
    }
});




// Get full user data (excluding password)
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal server error' });
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

// Route to fetch exclusive courses
app.get('/api/paid-courses', async (req, res) => {
    try {
        const courses = await PaidCourse.find({});
        res.json(courses);
    } catch (error) {
        console.error('Error fetching exclusive courses:', error.message);
        res.status(500).json({ error: 'Failed to fetch exclusive courses' });
    }
});





// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

