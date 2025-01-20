document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id'); // Get course ID
    const courseType = urlParams.get('type'); // Get course type

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
            if (!response.ok) {
                throw new Error('Failed to fetch course details');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching course details:', error);
            return null;
        }
    }

    // Render course details dynamically
    async function renderCourseDetails() {
        const course = await fetchCourseDetails();
        if (!course) {
            document.querySelector('.course-container').innerHTML = '<p>Failed to load course details. Please try again later.</p>';
            return;
        }

        // Update header background
        const header = document.querySelector('.course-header');
        if (course.headerback) {
            header.style.backgroundImage = `url(${course.headerback})`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
            header.style.backgroundRepeat = 'no-repeat';
        }

        // Update course title and description
        document.querySelector('.header-left h1').textContent = course.name || 'Untitled Course';
        document.querySelector('.course-description .expandable-content').textContent =
            course.description || 'No description available.';

        // Update features list dynamically
        const featuresList = document.querySelector('.features-list');
        const dynamicFeatures = [
            course.modules && { icon: 'fas fa-quiz', label: `${course.modules.length} module(s)` },
            course.project && { icon: 'fas fa-file', label: `${course.project.length || 0} project(s)` },
            { icon: 'fas fa-mobile-alt', label: 'Access on tablet and phone' },
            { icon: 'fas fa-certificate', label: 'Certificate of completion' },
        ].filter(Boolean); // Remove null/undefined entries

        featuresList.innerHTML = dynamicFeatures
            .map(feature => `<li><i class="${feature.icon}"></i> ${feature.label}</li>`)
            .join('');

        // Update skills covered dynamically
        const skillsTags = document.querySelector('.skills-tags');
        if (course.keySkills) {
            skillsTags.innerHTML = course.keySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
        }

        // Update languages dynamically
        if (course.languages) {
            const languagesSection = document.createElement('section');
            languagesSection.innerHTML = `
                <h2>Available in</h2>
                <div class="languages-tags">
                    ${course.languages.map(language => `<span class="language-tag">${language}</span>`).join('')}
                </div>
            `;
            document.querySelector('.content-left').appendChild(languagesSection);
        }

        // Update syllabus dynamically
        const syllabusContainer = document.querySelector('.course-syllabus');
        if (course.modules) {
            syllabusContainer.innerHTML = course.modules.map(module => `
                <div class="chapter">
                    <div class="chapter-header">
                        <h3>${module.title}</h3>
                        <span>${module.topics.length || 0} topics</span>
                    </div>
                    <div class="chapter-content">
                        <ul>
                            ${module.topics.map(topic => `<li>${topic.title}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');
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

    renderCourseDetails();
    displayExclusiveCourses();
});
