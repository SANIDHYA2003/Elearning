document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const courseType = urlParams.get('type');
    const courseTitle = document.getElementById('courseTitle');
    const courseStructure = document.getElementById('courseStructure');
    const topicTitle = document.getElementById('topicTitle');
    const topicContent = document.getElementById('topicContent');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    let currentTopicIndex = 0;
    let topics = [];

    // Initialize markdown-it parser
    const md = window.markdownit();

    async function fetchCourseDetails() {
        if (!courseType || (courseType !== 'free' && courseType !== 'paid')) {
            courseStructure.innerHTML = '<p>Invalid course type. Please check the URL and try again.</p>';
            return null;
        }

        try {
            const endpoint = courseType === 'paid'
                ? `/api/paid-courses/by-id/${courseId}`
                : `/api/courses/by-id/${courseId}`;

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

    function renderCourseStructure(course) {
        courseTitle.textContent = course.title || course.name || 'Untitled Course';
        topics = course.modules.flatMap(module => module.topics);

        if (!topics.length) {
            courseStructure.innerHTML = '<p>No topics available for this course.</p>';
            return;
        }

        let globalIndex = 0;

        courseStructure.innerHTML = course.modules.map(module => `
            <div class="module">
                <div class="module-title">${module.title}</div>
                <ul class="topic-list">
                    ${module.topics.map(topic => `
                        <li class="topic" data-index="${globalIndex++}">${topic.title}</li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        document.querySelectorAll('.topic').forEach(topicElement => {
            topicElement.addEventListener('click', (event) => {
                const clickedIndex = parseInt(event.target.getAttribute('data-index'), 10);
                if (!isNaN(clickedIndex)) {
                    currentTopicIndex = clickedIndex;
                    loadTopic(topics[currentTopicIndex]);
                }
            });
        });

        loadTopic(topics[0]); // Load the first topic by default
    }

    async function loadTopic(topic) {
        if (!topic) {
            console.warn('No topic available to load.');
            return;
        }

        // Clear active topic highlighting and set new active topic
        document.querySelectorAll('.topic').forEach(el => el.classList.remove('active-topic'));
        document.querySelector(`.topic[data-index="${currentTopicIndex}"]`).classList.add('active-topic');

        // Set topic title
        topicTitle.textContent = topic.title;

        // Start loading content
        topicContent.classList.add('loading');
        topicContent.innerHTML = '<p>Loading content...</p>';

        if (courseType === 'paid') {
            // Render markdown content, including inline images
            const markdownContent = topic.content ? md.render(topic.content) : '<p>No content available for this topic.</p>';

            topicContent.innerHTML = `
        <div class="video-section">
            <!-- Embed YouTube video -->
            ${topic.video ? `
                <iframe width="640" height="360" src="https://www.youtube.com/embed/${getYouTubeVideoId(topic.video)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            ` : '<p>No video available for this topic.</p>'}
        </div>
        <div class="content-section">
            ${markdownContent}
        </div>
        <div class="notes-download">
            <button id="downloadNotesButton">Download Notes</button>
        </div>
    `;

            // Add event listener for download button
            const downloadButton = document.getElementById('downloadNotesButton');
            downloadButton.addEventListener('click', () => {
                if (topic.notesUrl) {
                    window.open(topic.notesUrl, '_blank');
                } else {
                    alert('Notes are not available for this topic.');
                }
            });
        }

  else if (courseType === 'free') {
            // Generate content for free courses
            const content = await generateContent(topic.title);
            topicContent.innerHTML = `
        <div class="content-section">
            ${content}
        </div>
        `;
        }

        // Stop loading content
        topicContent.classList.remove('loading');

        // Update navigation buttons
        updateNavigationButtons();
    }

    // Helper function to extract YouTube video ID from a shareable URL
    function getYouTubeVideoId(url) {
        const regex = /(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
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

    function updateNavigationButtons() {
        prevButton.disabled = currentTopicIndex === 0;
        nextButton.disabled = currentTopicIndex === topics.length - 1;
    }

    prevButton.addEventListener('click', () => {
        if (currentTopicIndex > 0) {
            currentTopicIndex--;
            loadTopic(topics[currentTopicIndex]);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentTopicIndex < topics.length - 1) {
            currentTopicIndex++;
            loadTopic(topics[currentTopicIndex]);
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
