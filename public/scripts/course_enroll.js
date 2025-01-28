document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const courseType = urlParams.get('type');
    let currentCourse = null; // Added for payment flow

    // Payment modal elements
    const cartModal = document.getElementById('cartModal');
    const confirmModal = document.getElementById('confirmationModal');
    const closeSpans = document.querySelectorAll('.close');

    // Modal close handlers
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
    // Fetch course details dynamically
    async function fetchCourseDetails() {
        const endpoint = courseType === 'paid'
            ? `/api/paid-courses/by-id/${courseId}`
            : `/api/courses/by-id/${courseId}`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch course details');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
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

    // Modified renderCourseDetails function with payment flow
    async function renderCourseDetails() {
        const course = await fetchCourseDetails();
        if (!course) {
            document.querySelector('.course-container').innerHTML =
                '<p>Failed to load course details. Please try again later.</p>';
            return;
        }
        currentCourse = course; // Store course for payment flow

        // Set up enroll button
        const enrollButton = document.querySelector('.enroll-btn');
        enrollButton.setAttribute('data-id', courseId);
        enrollButton.setAttribute('data-type', courseType);

        // Modified enroll button handler
        enrollButton.addEventListener('click', async (e) => {
            const targetId = e.target.getAttribute('data-id');
            const targetType = e.target.getAttribute('data-type');

            // Check if already purchased
            const isPurchased = await checkCoursePurchase(targetId);
            if (isPurchased) {
                window.location.href = `course_page.html?id=${targetId}&type=${targetType}`;
                return;
            }

            // Show payment flow for paid courses
            if (targetType === 'paid') {
                showCartModal(currentCourse);
            } else {
                window.location.href = `course_page.html?id=${targetId}&type=${targetType}`;
            }
        });
        // Update course header
        const header = document.querySelector('.course-header');
        if (course.headerback) {
            header.style.background = `url(${course.headerback}) center/cover no-repeat`;
        }

        // Populate course info
        document.querySelector('.header-left h1').textContent = course.name || 'Untitled Course';
        document.querySelector('.course-description .expandable-content').textContent = 
            course.description || 'No description available.';

        // Update features list
        const featuresList = document.querySelector('.features-list');
        const features = [
            course.modules && { icon: 'fas fa-quiz', label: `${course.modules.length} modules` },
            course.project && { icon: 'fas fa-file', label: `${course.project.length} projects` },
            { icon: 'fas fa-mobile-alt', label: 'Multi-device access' },
            { icon: 'fas fa-certificate', label: 'Completion certificate' }
        ].filter(Boolean);
        
        featuresList.innerHTML = features.map(f => 
            `<li><i class="${f.icon}"></i> ${f.label}</li>`
        ).join('');

        // Update skills
        const skillsTags = document.querySelector('.skills-tags');
        if (course.keySkills) {
            skillsTags.innerHTML = course.keySkills
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join('');
        }

        // Update syllabus
        const syllabusContainer = document.querySelector('.course-syllabus');
        if (course.modules) {
            syllabusContainer.innerHTML = course.modules.map((module, index) => `
                <div class="chapter" data-chapter="${index + 1}">
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
    }

    // Display exclusive courses dynamically
    async function displayExclusiveCourses() {
        const courses = await fetchExclusiveCourses();
        const exclusiveCoursesContainer = document.querySelector('.related-courses');
        if (!Array.isArray(courses) || courses.length === 0) {
            exclusiveCoursesContainer.innerHTML = `<p>No exclusive courses available at the moment.</p>`;
            return;
        }

        exclusiveCoursesContainer.innerHTML = courses.map(course => `
            <div class="course-card">
                <img src="${course.thumbnail}" alt="${course.name}" class="course-thumbnail" />
                <h3>${course.name}</h3>
                <p><strong>Price:</strong> $${course.price}</p>
                <button class="enroll-course-btn" data-id="${course._id}" data-type="paid">Enroll</button>
            </div>
        `).join('');

        // Add event listeners to "Enroll" buttons
        document.querySelectorAll('.enroll-course-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const courseId = e.target.getAttribute('data-id');
                const courseType = e.target.getAttribute('data-type');
                if (courseId && courseType) {
                    window.location.href = `/course_enroll.html?id=${courseId}&type=${courseType}`;
                }
            });
        });
    }


    // Payment flow functions
    async function checkCoursePurchase(courseId) {
        // Implement API call to check purchase status
        return false; // Temporary placeholder
    }

    async function showCartModal(course) {
        document.getElementById('cartCourseName').textContent = course.name;
        document.getElementById('cartCoursePrice').textContent = course.price;

        // Fetch wallet balance
        const balance = await fetchWalletBalance();
        document.getElementById('walletBalance').textContent = balance;

        cartModal.style.display = 'block';
    }

    async function fetchWalletBalance() {
        // Implement API call to get wallet balance
        return 100; // Temporary placeholder
    }

    // Coupon Apply Handler
    document.getElementById('applyCoupon').addEventListener('click', async () => {
        const couponCode = document.getElementById('couponCode').value;
        // Implement coupon validation
    });

    // Proceed to Buy Handler
    document.getElementById('proceedToBuy').addEventListener('click', () => {
        cartModal.style.display = 'none';
        confirmModal.style.display = 'block';
        document.getElementById('confirmAmount').textContent =
            document.getElementById('cartCoursePrice').textContent;
    });

    document.getElementById('confirmYes').addEventListener('click', async () => {
        try {
            // Process payment
            const success = await processPayment();
            if (success) {
                confirmModal.style.display = 'none';

                const enrollButton = document.querySelector('.enroll-btn');
                enrollButton.textContent = 'Go to Course';

                // Remove all previous click event listeners
                const newEnrollButton = enrollButton.cloneNode(true);
                enrollButton.parentNode.replaceChild(newEnrollButton, enrollButton);

                // Add the new click event listener for redirecting to the course page
                newEnrollButton.addEventListener('click', () => {
                    window.location.href = `course_page.html?id=${courseId}&type=${courseType}`;
                });
            }
        } catch (error) {
            console.error('Payment failed:', error);
        }
    });

    document.getElementById('confirmNo').addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    async function processPayment() {
        // Implement actual payment processing
        return true; // Temporary success
    }


    // Initial setup
    displayExclusiveCourses();
    await renderCourseDetails();
   
    
});