document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const courseType = urlParams.get('type');
    let currentCourse = null;

    // Payment modal elements
    const cartModal = document.getElementById('cartModal');
    const confirmModal = document.getElementById('confirmationModal');
    const closeSpans = document.querySelectorAll('.close');

    // Close modal listeners
    closeSpans.forEach(span => {
        span.addEventListener('click', () => {
            cartModal.style.display = 'none';
            confirmModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === confirmModal) confirmModal.style.display = 'none';
    });

    // ✅ Fetch Course Details
    async function fetchCourseDetails() {
        const endpoint = courseType === 'paid'
            ? `/api/paid-courses/by-id/${courseId}`
            : `/api/courses/by-id/${courseId}`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch course details');
            return await response.json();
        } catch (error) {
            console.error('Error fetching course details:', error);
            return null;
        }
    }

    // Fetch exclusive courses
    async function fetchExclusiveCourses() {
        try {
            const response = await fetch('/api/paid-courses');
            if (!response.ok) {
                console.error(`Error fetching exclusive courses. HTTP Status: ${response.status}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching exclusive courses:', error);
            return [];
        }
    }


    // ✅ Fetch user balance
    async function fetchWalletBalance(userId) {
        try {
            const response = await fetch(`/api/user/${userId}/coins`);
            if (!response.ok) throw new Error('Failed to fetch wallet balance');
            const data = await response.json();
            return data.rewardCoins;
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            return 0;
        }
    }

    // ✅ Check if Course is Already Purchased
    async function checkCoursePurchase(courseId, userId) {
        try {
            const response = await fetch(`/api/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user data');
            const user = await response.json();
            return user.enrolledCourses.some(course => course.courseId === courseId);
        } catch (error) {
            console.error('Error checking purchased courses:', error);
            return false;
        }
    }




    // ✅ Update Course Page
    // ✅ Update Course Page
    async function renderCourseDetails() {
        currentCourse = await fetchCourseDetails();
        if (!currentCourse) {
            document.querySelector('.course-container').innerHTML =
                '<p>Failed to load course details. Please try again later.</p>';
            return;
        }

        // ✅ Update Course Header
        const header = document.querySelector('.course-header');
        if (currentCourse.headerback) {
            header.style.background = `url(${currentCourse.headerback}) center/cover no-repeat`;
        }

        // ✅ Populate Course Info
        document.querySelector('.header-left h1').textContent = currentCourse.name || 'Untitled Course';
        document.querySelector('.course-description .expandable-content').textContent =
            currentCourse.description || 'No description available.';

        // ✅ Update Key Skills
        const skillsTags = document.querySelector('.skills-tags');
        if (currentCourse.keySkills) {
            skillsTags.innerHTML = currentCourse.keySkills
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join('');
        }

        // ✅ Update Features List
        const featuresList = document.querySelector('.features-list');
        const features = [
            currentCourse.modules && { icon: 'fas fa-quiz', label: `${currentCourse.modules.length} modules` },
            currentCourse.project && { icon: 'fas fa-file', label: `${currentCourse.project.length} projects` },
            { icon: 'fas fa-mobile-alt', label: 'Multi-device access' },
            { icon: 'fas fa-certificate', label: 'Completion certificate' }
        ].filter(Boolean);

        featuresList.innerHTML = features.map(f =>
            `<li><i class="${f.icon}"></i> ${f.label}</li>`
        ).join('');

        // ✅ Update Course Syllabus
        const syllabusContainer = document.querySelector('.course-syllabus');
        if (currentCourse.modules) {
            syllabusContainer.innerHTML = currentCourse.modules.map((module, index) => `
                <div class="chapter">
                    <div class="chapter-header">
                        <h3>${module.title}</h3>
                        <span class="chapter-duration">${module.topics.length} topics</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="chapter-content">
                        <ul>${module.topics.map(t => `<li>${t.title}</li>`).join('')}</ul>
                    </div>
                </div>`
            ).join('');
        }

        // ✅ Display Related Courses Under "Related Courses"
        async function displayExclusiveCourses() {
            const courses = await fetchExclusiveCourses();
            const relatedCoursesContainer = document.querySelector('.related-courses');

            if (!Array.isArray(courses) || courses.length === 0) {
                relatedCoursesContainer.innerHTML = `<p>No related courses available at the moment.</p>`;
                return;
            }

            relatedCoursesContainer.innerHTML = courses.map(course => `
        <div class="course-card">
            <img src="${course.thumbnail}" alt="${course.name}" class="course-thumbnail" />
            <h3>${course.name}</h3>
            <p><strong>Price:</strong> $${course.price}</p>
            <button class="enroll-course-btn" data-id="${course._id}">View</button>
        </div>
    `).join('');

            document.querySelectorAll('.enroll-course-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const selectedCourseId = e.target.getAttribute('data-id');
                    window.location.href = `/course_enroll.html?id=${selectedCourseId}&type=paid`;
                });
            });
        }

        // ✅ Update Enroll Button Status
        updateEnrollButton();

        // ✅ Actually display the exclusive courses
        await displayExclusiveCourses(); // Add this line to execute the function



    }

    // ✅ Update Enroll Button State
    async function updateEnrollButton() {
        const enrollButton = document.querySelector('.enroll-btn');
        if (!enrollButton) return;

        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) return;

        const isPurchased = await checkCoursePurchase(courseId, user._id);
        if (isPurchased) {
            enrollButton.textContent = 'Go to Course';
            enrollButton.classList.add('go-to-course');
            enrollButton.removeEventListener('click', enrollClickHandler);
            enrollButton.addEventListener('click', () => {
                window.location.href = `course_page.html?id=${courseId}&type=${courseType}`;
            });
        } else {
            enrollButton.textContent = 'Enroll Now';
            enrollButton.classList.remove('go-to-course');
            enrollButton.addEventListener('click', enrollClickHandler);
        }
    }

    // ✅ Enroll Button Click Handler (Handle Payment for Paid Courses)
    async function enrollClickHandler(event) {
        const targetId = event.target.getAttribute('data-id');
        const targetType = event.target.getAttribute('data-type');

        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) {
            alert('Please log in to enroll in a course.');
            return;
        }

        const isPurchased = await checkCoursePurchase(targetId, user._id);
        if (isPurchased) {
            window.location.href = `course_page.html?id=${targetId}&type=${targetType}`;
            return;
        }

        if (targetType === 'paid') {
            showCartModal(currentCourse);
        } else {
            window.location.href = `course_page.html?id=${targetId}&type=${targetType}`;
        }
    }

    // ✅ Open Payment Modal for Paid Courses
    async function showCartModal(course) {
        document.getElementById('cartCourseName').textContent = course.name;
        document.getElementById('cartCoursePrice').textContent = `$${course.price}`;

        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user) {
            const balance = await fetchWalletBalance(user._id);
            document.getElementById('walletBalance').textContent = `$${balance}`;
        }

        cartModal.style.display = 'block';
    }

    // ✅ Handle Payment
    document.getElementById('proceedToBuy').addEventListener('click', async () => {
        cartModal.style.display = 'none';
        confirmModal.style.display = 'block';
        document.getElementById('confirmAmount').textContent =
            document.getElementById('cartCoursePrice').textContent;
    });

    document.getElementById('confirmYes').addEventListener('click', async () => {
        const success = await processPayment();
        if (success) {
            confirmModal.style.display = 'none';
            updateEnrollButton();
        }
    });

    async function processPayment() {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) {
            alert('Please log in to purchase the course.');
            return false;
        }

        try {
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: currentCourse._id,
                    userId: user._id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Payment failed');
            }

            localStorage.setItem(`enrolled_${courseId}`, 'true');
            return true;
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.message);
            return false;
        }
    }

    

    // ✅ Initialize Course Page
    await renderCourseDetails();

});
