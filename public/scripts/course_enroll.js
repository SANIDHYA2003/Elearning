document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id'); // Get course ID
    const courseType = urlParams.get('type'); // Get course type

    if (!courseId || !courseType) {
        document.querySelector('.course-container').innerHTML = '<p>Invalid course data. Please try again.</p>';
        return;
    }

    // Fetch course details
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
        if (course.thumbnail) {
            header.style.backgroundImage = `url(${course.headerback})`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
            header.style.backgroundRepeat = 'no-repeat';
        }

        // Update course title
        document.querySelector('.header-left h1').textContent = course.name || 'Untitled Course';

        // Update description
        document.querySelector('.course-description .expandable-content').textContent =
            course.description || 'No description available.';

        // Update what's included
        const featuresList = document.querySelector('.features-list');
        featuresList.innerHTML = `
            <li><i class="fas fa-file"></i> ${course.project.length} project(s)</li>
            <li><i class="fas fa-quiz"></i> ${course.modules.length} module(s)</li>
            <li><i class="fas fa-mobile-alt"></i> Access on tablet and phone</li>
            <li><i class="fas fa-certificate"></i> Certificate of completion</li>
        `;

        // Update skills covered
        const skillsTags = document.querySelector('.skills-tags');
        skillsTags.innerHTML = course.keySkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');

        // Update languages
        const languagesSection = document.createElement('section');
        languagesSection.innerHTML = `
            <h2>Available in</h2>
            <div class="languages-tags">
                ${course.languages.map(language => `<span class="language-tag">${language} </span>`).join('')}
            </div>
        `;
        document.querySelector('.content-left').appendChild(languagesSection);

        // Update syllabus
        const syllabusContainer = document.querySelector('.course-syllabus');
        syllabusContainer.innerHTML = course.modules.map(module => `
            <div class="chapter">
                <div class="chapter-header">
                    <h3>${module.title}</h3>
                    <span>${module.topics.length} topics</span>
                </div>
                <div class="chapter-content">
                    <ul>
                        ${module.topics.map(topic => `<li>${topic.title}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');


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

            RELATEDCOURSES.innerHTML = courses.map(course => `
                <div class="course-card">
                    <img src="${course.thumbnail}" alt="${course.name}" class="course-thumbnail" />
                    <h3>${course.name}</h3>
                    <p><strong>Price:</strong> $${course.price}</p>
                    <button class="enroll-course-btn" data-id="${course._id}" data-type="paid">Enrolled</button>
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




    renderCourseDetails();
    displayExclusiveCourses();
});
