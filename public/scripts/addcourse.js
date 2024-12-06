document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCourseForm');
    const addModuleBtn = document.getElementById('addModule');
    const modulesContainer = document.getElementById('modules');

    let moduleCount = 0;

    addModuleBtn.addEventListener('click', () => {
        moduleCount++;
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module';
        moduleDiv.innerHTML = `
            <h3>Module ${moduleCount}</h3>
            <div class="form-group">
                <label for="module-title-${moduleCount}">Module Title:</label>
                <input type="text" id="module-title-${moduleCount}" name="modules[${moduleCount - 1}][title]" required>
            </div>
            <div class="topics">
                <h4>Topics</h4>
            </div>
            <button type="button" class="add-topic">Add Topic</button>
            <button type="button" class="remove-btn">Remove Module</button>
        `;
        modulesContainer.appendChild(moduleDiv);

        const addTopicBtn = moduleDiv.querySelector('.add-topic');
        const topicsContainer = moduleDiv.querySelector('.topics');
        let topicCount = 0;

        addTopicBtn.addEventListener('click', () => {
            topicCount++;
            const topicDiv = document.createElement('div');
            topicDiv.className = 'topic';
            topicDiv.innerHTML = `
                <div class="form-group">
                    <label for="topic-title-${moduleCount}-${topicCount}">Topic Title:</label>
                    <input type="text" id="topic-title-${moduleCount}-${topicCount}" name="modules[${moduleCount - 1}][topics][${topicCount - 1}][title]" required>
                </div>
                <button type="button" class="remove-btn">Remove Topic</button>
            `;
            topicsContainer.appendChild(topicDiv);

            topicDiv.querySelector('.remove-btn').addEventListener('click', () => {
                topicsContainer.removeChild(topicDiv);
            });
        });

        moduleDiv.querySelector('.remove-btn').addEventListener('click', () => {
            modulesContainer.removeChild(moduleDiv);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const courseData = {
            title: formData.get('title'),
            category: formData.get('category'),
            modules: []
        };

        const moduleInputs = form.querySelectorAll('.module');
        moduleInputs.forEach((moduleInput, moduleIndex) => {
            const moduleTitle = formData.get(`modules[${moduleIndex}][title]`);
            const topicInputs = moduleInput.querySelectorAll('.topic input');
            const topics = Array.from(topicInputs).map(input => ({ title: input.value }));
            courseData.modules.push({ title: moduleTitle, topics });
        });

        try {
            const response = await fetch('http://localhost:5500/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('Server response:', result);
            alert('Course added successfully!');
            form.reset();
            modulesContainer.innerHTML = '';
            moduleCount = 0;
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred while adding the course: ${error.message}`);
        }
    });
});

