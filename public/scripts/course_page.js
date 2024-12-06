document.addEventListener('DOMContentLoaded', () => {
    const courseId = window.location.pathname.split('/').pop(); // Extract course ID from URL
    const courseTitle = document.getElementById('courseTitle');
    const courseStructure = document.getElementById('courseStructure');
    const topicTitle = document.getElementById('topicTitle');
    const topicContent = document.getElementById('topicContent');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    let currentTopicIndex = 0;
    let topics = [];

    async function fetchCourseDetails() {
        try {
            const response = await fetch(`/api/courses/by-id/${courseId}`); // Updated route
            if (!response.ok) {
                throw new Error('Failed to fetch course details');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching course details:', error);
            return null;
        }
    }

    async function generateContent(topic) {
        try {
            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!response.ok) {
                throw new Error('Failed to generate content');
            }
            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('Error generating content:', error);
            return '<p>Failed to load content. Please try again later.</p>';
        }
    }

    function renderCourseStructure(course) {
        courseTitle.textContent = course.title;
        topics = course.modules.flatMap(module => module.topics);

        courseStructure.innerHTML = course.modules.map(module => `
            <div class="module">
                <div class="module-title">${module.title}</div>
                <ul class="topic-list">
                    ${module.topics.map(topic => `
                        <li class="topic" data-topic="${topic.title}">${topic.title}</li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        document.querySelectorAll('.topic').forEach((topicElement, index) => {
            topicElement.addEventListener('click', () => {
                currentTopicIndex = index;
                loadTopic(topicElement.getAttribute('data-topic'));
            });
        });

        if (topics.length > 0) {
            loadTopic(topics[0].title);
        }
    }

    async function loadTopic(topic) {
        document.querySelectorAll('.topic').forEach(el => el.classList.remove('active-topic'));
        document.querySelector(`.topic[data-topic="${topic}"]`).classList.add('active-topic');
        topicTitle.textContent = topic;

        topicContent.classList.add('loading');
        topicContent.innerHTML = '<p>Loading content...</p>';

        const content = await generateContent(topic);

        topicContent.innerHTML = content;
        topicContent.classList.remove('loading');
        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        prevButton.disabled = currentTopicIndex === 0;
        nextButton.disabled = currentTopicIndex === topics.length - 1;
    }

    prevButton.addEventListener('click', () => {
        if (currentTopicIndex > 0) {
            currentTopicIndex--;
            loadTopic(topics[currentTopicIndex].title);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentTopicIndex < topics.length - 1) {
            currentTopicIndex++;
            loadTopic(topics[currentTopicIndex].title);
        }
    });

    async function initializePage() {
        const course = await fetchCourseDetails();
        if (course) {
            renderCourseStructure(course);
        } else {
            courseStructure.innerHTML = '<p>Failed to load course details. Please try again later.</p>';
        }
    }

    initializePage();
});

