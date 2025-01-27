document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const courseType = urlParams.get('type');

    if (!courseId || !courseType) {
        document.querySelector('.course-container').innerHTML = '<p>Invalid course data. Please try again.</p>';
        return;
    }

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

    // Main render function
    async function renderCourseDetails() {
        const course = await fetchCourseDetails();
        if (!course) {
            document.querySelector('.course-container').innerHTML = 
                '<p>Failed to load course details. Please try again later.</p>';
            return;
        }

        // Set up enroll button
        const enrollButton = document.querySelector('.enroll-btn');
        enrollButton.setAttribute('data-id', courseId);
        enrollButton.setAttribute('data-type', courseType);
        
        enrollButton.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-id');
            const targetType = e.target.getAttribute('data-type');
            if (targetId && targetType) {
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



    // Initial setup
    displayExclusiveCourses();
    await renderCourseDetails();
    await handleRelatedCourses();
    
});