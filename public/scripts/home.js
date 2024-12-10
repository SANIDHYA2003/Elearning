document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('exploreBtn');
    const courseList = document.getElementById('courseList');
    const userInfo = document.getElementById('userInfo');


    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupModal = document.getElementById('signupModal');
    const loginModal = document.getElementById('loginModal');
    const closeButtons = document.querySelectorAll('.close');

    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');




    // Open modals
    signupBtn.addEventListener('click', () => signupModal.style.display = 'block');
    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');

    // Close modals
    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        signupModal.style.display = 'none';
        loginModal.style.display = 'none';
    }));





    
    // Fetch courses from the backend
    async function fetchCourses() {
        try {
            console.log('Fetching courses...');
            const response = await fetch('/api/courses');
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                return [];
            }
            const courses = await response.json();
            console.log('Courses fetched:', courses);
            return courses;
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    }

    // Display courses on the home page
    async function displayCourses(filteredCourses = null) {
        const courses = filteredCourses || await fetchCourses();

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
                if (courseId) {
                    window.location.href = `/course/${courseId}?id=${courseId}`;
                }
            });
        });
    }

 

    // Display user information
    async function displayUserInfo() {
        try {
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
        } catch (error) {
            console.error('Error displaying user info:', error);
        }
    }


    // Handle Signup
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            organization: document.getElementById('organization').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
        };

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            const result = await response.json();
            if (response.ok) {
                alert('Signup successful!');
                signupModal.style.display = 'none';
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Signup failed:', error);
        }
    });

    // Handle Login
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const loginData = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value,
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const result = await response.json();
            if (response.ok) {
                alert('Login successful!');
                loginModal.style.display = 'none';
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    // Initialize
    exploreBtn.addEventListener('click', () => {
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    });

    displayCourses();
    displayUserInfo();
});
