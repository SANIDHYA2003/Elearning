document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('exploreBtn');
    const courseList = document.getElementById('courseList');
    const userInfoContainer = document.getElementById("user-info-container");
    const exclusiveCoursesContainer = document.getElementById('exclusiveCoursesContainer');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupModal = document.getElementById('signupModal');
    const loginModal = document.getElementById('loginModal');
    const closeButtons = document.querySelectorAll('.close');
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    // Add CSS for animations and styling dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background-color: #fff;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .navbar .nav-items {
            display: flex;
            gap: 20px;
        }
        .user-info {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: #f9f9f9;
            padding: 10px 15px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            animation: fadeIn 0.5s ease-out;
        }
        .user-info span {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .bi-person-circle {
            font-size: 24px;
            color: #007bff;
            margin-right: 8px;
        }
        .bi-coin {
            font-size: 20px;
            color: #ffd700;
            margin-right: 5px;
        }
        #signout-btn {
            background-color: #a80d0d;
            color: white;
            font-weight: bold;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        #signout-btn:hover {
            background-color: #FF0000;
        }
    `;
    document.head.appendChild(style);

    // Open modals
    signupBtn.addEventListener('click', () => signupModal.style.display = 'block');
    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');

    // Close modals
    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        signupModal.style.display = 'none';
        loginModal.style.display = 'none';
    }));

    // Function to fetch updated coin info for the logged-in user
    async function fetchUserCoins(userId) {
        try {
            const response = await fetch(`/api/user/${userId}/coins`);
            if (response.ok) {
                const { rewardCoins } = await response.json();
                return rewardCoins;
            } else {
                console.error('Failed to fetch updated coin info.');
            }
        } catch (error) {
            console.error('Error fetching user coins:', error);
        }
        return null; // Return null if fetching fails
    }

    // Function to update only the coins dynamically
    async function updateUserCoins() {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const updatedCoins = await fetchUserCoins(user._id);

            if (updatedCoins !== null) {
                user.rewardCoins = updatedCoins; // Update the user's coins in localStorage
                localStorage.setItem('loggedInUser', JSON.stringify(user));

                // Update the coin display in the UI
                const coinElement = userInfoContainer.querySelector('.bi-coin').parentNode;
                if (coinElement) {
                    coinElement.textContent = `${updatedCoins} Coins`;
                }
            }
        }
    }

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
                <button class="view-course-btn" data-id="${course._id}" data-type="free">View Course</button>
            </div>
        `).join('');

        // Add event listeners to "View Course" buttons
        document.querySelectorAll('.view-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.target.getAttribute('data-id');
                const courseType = e.target.getAttribute('data-type'); // Get course type
                if (courseId && courseType) {
                    window.location.href = `/course/${courseId}?id=${courseId}&type=${courseType}`;
                }
            });
        });
    }

    // Display exclusive courses
    async function fetchExclusiveCourses() {
        try {
            console.log('Requesting exclusive courses from backend...');
            const response = await fetch('/api/paid-courses');
            if (!response.ok) {
                console.error(`Error fetching exclusive courses. HTTP Status: ${response.status}`);
                return [];
            }
            const data = await response.json();
            console.log('Exclusive courses fetched successfully:', data);
            return data;
        } catch (error) {
            console.error('Error fetching exclusive courses:', error);
            return [];
        }
    }

    // Display exclusive courses
    async function displayExclusiveCourses() {
        try {
            console.log('Attempting to display exclusive courses...');
            const courses = await fetchExclusiveCourses();

            if (!Array.isArray(courses) || courses.length === 0) {
                console.warn('No exclusive courses found to display.');
                exclusiveCoursesContainer.innerHTML = `<p>No exclusive courses available at the moment.</p>`;
                return;
            }

            exclusiveCoursesContainer.innerHTML = courses.map(course => `
                <div class="course-card">
                    <img src="${course.thumbnail}" alt="${course.name}" class="course-thumbnail" />
                    <h3>${course.name}</h3>
                    <p>${course.description}</p>
                    <p><strong>Price:</strong> $${course.price}</p>
                    <p><strong>Level:</strong> ${course.level}</p>
                    <p><strong>Modules:</strong> ${course.modules.map(module => module.title).join(', ')}</p>
                    <button class="enroll-course-btn" data-id="${course._id}" data-type="paid">View Paid Course</button>
                </div>
            `).join('');

            // Add event listeners to "Enrolled" buttons
            document.querySelectorAll('.enroll-course-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const courseId = e.target.getAttribute('data-id'); // Get course ID
                    const courseType = e.target.getAttribute('data-type'); // Get course type
                    if (courseId && courseType) {
                        // Navigate to course_enroll.html with course ID and type in query parameters
                        window.location.href = `/course_enroll.html?id=${courseId}&type=${courseType}`;
                    }
                });
            });


            console.log('Exclusive courses displayed successfully.');
        } catch (error) {
            console.error('Error displaying exclusive courses:', error);
        }
    }

    // Show user info
    function showUserInfo(user) {
        userInfoContainer.innerHTML = `
            <div class="user-info">
                <span><i class="bi bi-person-circle"></i> ${user.name}</span>
                <span><i class="bi bi-coin"></i> ${user.rewardCoins} Coins</span>
                <button id="signout-btn"><i class="bi bi-box-arrow-right"></i> Sign Out</button>
            </div>`;
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';

        document.getElementById("signout-btn").addEventListener("click", () => {
            localStorage.removeItem('loggedInUser');
            userInfoContainer.innerHTML = '';
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
        });
    }

    // Initialize user info from localStorage
    function initializeUserInfo() {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            showUserInfo(user);
        }
    }

    // Handle signup
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

    // Handle login
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const { user } = await response.json();
            if (response.ok) {
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                showUserInfo(user);
                loginModal.style.display = 'none';
            } else {
                alert('Login failed!');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });

    // Initialize the page
    exploreBtn.addEventListener('click', () => {
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    });

    initializeUserInfo();
    displayCourses();
    displayExclusiveCourses();
});
