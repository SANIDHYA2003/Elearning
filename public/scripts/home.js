document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('exploreBtn');
    const courseList = document.getElementById('courseList');
    const userInfo = document.getElementById('userInfo');
    const chatArea = document.getElementById('chatArea');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Fetch courses from the backend
    async function fetchCourses() {
        try {
            console.log('Fetching courses...');
            const response = await fetch('/api/courses');
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const courses = await response.json();
            console.log('Fetched courses:', courses);
            return courses;
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }

    // Display courses on the home page
    async function displayCourses() {
        try {
            const courses = await fetchCourses();
            console.log('Displaying courses:', courses);

            if (!Array.isArray(courses) || courses.length === 0) {
                courseList.innerHTML = `<p>No courses available at the moment.</p>`;
                return;
            }

            courseList.innerHTML = courses.map(course => `
                <div class="course-card">
                    <h3>${course.title || 'Untitled Course'}</h3>
                    <p>Category: ${course.category || 'Uncategorized'}</p>
                    <p>Modules: ${course.modules?.length || 0}</p>
                    <button class="view-course-btn" data-id="${course._id}">View Course</button>
                </div>
            `).join('');

            // Add event listeners to "View Course" buttons
            document.querySelectorAll('.view-course-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const courseId = e.target.getAttribute('data-id');
                    console.log('Clicked course ID:', courseId);
                    if (courseId) {
                        window.location.href = `/course/${courseId}?id=${courseId}`;
                    }
                });
            });
        } catch (error) {
            console.error('Error displaying courses:', error);
            courseList.innerHTML = `<p>Error loading courses. Please try again later.</p>`;
        }
    }

    // Fetch user data from the server
    async function fetchUserData() {
        try {
            const response = await fetch('/api/user');
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    // Display user profile information
    async function displayUserInfo() {
        const user = await fetchUserData();
        if (user) {
            userInfo.innerHTML = `
                <h3>${user.name}</h3>
                <p>Email: ${user.email}</p>
                <h4>Enrolled Courses:</h4>
                <ul>
                    ${user.enrolledCourses.map(course => `<li>${course.title}</li>`).join('')}
                </ul>
            `;
        }
    }

    // Handle AI Chat functionality
    sendBtn.addEventListener('click', async () => {
        const userMessage = userInput.value;
        if (userMessage.trim() !== '') {
            chatArea.innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: userMessage }),
                });

                if (!response.ok) {
                    throw new Error('Failed to process chat message');
                }

                const data = await response.json();
                chatArea.innerHTML += `<p><strong>AI:</strong> ${data.response}</p>`;
            } catch (error) {
                console.error('Error in AI chat:', error);
                chatArea.innerHTML += `<p><strong>AI:</strong> Unable to respond at the moment. Please try again later.</p>`;
            }
            chatArea.scrollTop = chatArea.scrollHeight; // Scroll to the latest message
            userInput.value = ''; // Clear input field
        }
    });

    // Initialize the application
    exploreBtn.addEventListener('click', () => {
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    });

    // Call functions to display courses and user info
    displayCourses();
    displayUserInfo();
});

