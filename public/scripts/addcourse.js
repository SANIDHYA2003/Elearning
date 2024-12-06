const form = document.getElementById('addCourseForm');
const coursesList = document.getElementById('coursesList');
const modulesContainer = document.getElementById('modules');
const addModuleButton = document.getElementById('addModule');
const updateModal = document.getElementById('updateModal');
const updateForm = document.getElementById('updateCourseForm');
const updateModulesContainer = document.getElementById('update_modules');
const closeModalButton = document.getElementById('closeModal');
const addUpdateModuleButton = document.getElementById('addUpdateModule');

let moduleCount = 0;
let updateModuleCount = 0;

// Load courses from the server
async function loadCourses() {
    try {
        const response = await fetch('http://localhost:5500/api/courses');
        const courses = await response.json();
        coursesList.innerHTML = ''; // Clear the current list

        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_code}</td>
                <td>${course.title}</td>
                <td>${course.category}</td>
                <td>${course.modules.map(module => module.title).join(', ')}</td>
                <td>
                    <button class="update-btn" data-code="${course.course_code}">Update</button>
                    <button class="delete-btn" data-code="${course.course_code}">Delete</button>
                </td>
            `;
            coursesList.appendChild(row);
        });

        // Add event listeners for Update and Delete buttons
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseCode = e.target.getAttribute('data-code');
                openUpdateModal(courseCode);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const courseCode = e.target.getAttribute('data-code');
                const confirmed = confirm('Are you sure you want to delete this course?');
                if (confirmed) {
                    await fetch(`http://localhost:5500/api/courses/${courseCode}`, { method: 'DELETE' });
                    loadCourses(); // Reload after deletion
                }
            });
        });

    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Add module dynamically in the Add Course Form
addModuleButton.addEventListener('click', () => {
    const moduleIndex = moduleCount++;
    const moduleDiv = document.createElement('div');
    moduleDiv.classList.add('module');
    moduleDiv.innerHTML = `
        <h3>Module ${moduleIndex + 1}</h3>
        <label for="modules[${moduleIndex}][title]">Module Title:</label>
        <input type="text" name="modules[${moduleIndex}][title]" required>
        <div class="topics">
            <label for="modules[${moduleIndex}][topics]">Topics:</label>
            <input type="text" name="modules[${moduleIndex}][topics][0]" required>
        </div>
        <button type="button" class="add-topic">Add Topic</button>
    `;
    modulesContainer.appendChild(moduleDiv);

    // Add topic functionality
    moduleDiv.querySelector('.add-topic').addEventListener('click', () => {
        const topicsDiv = moduleDiv.querySelector('.topics');
        const topicIndex = topicsDiv.children.length / 2;
        const newTopicInput = document.createElement('input');
        newTopicInput.type = 'text';
        newTopicInput.name = `modules[${moduleIndex}][topics][${topicIndex}]`;
        topicsDiv.appendChild(newTopicInput);
    });
});

// Handle adding a course
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const courseData = {
        course_code: formData.get('course_code'),
        title: formData.get('title'),
        category: formData.get('category'),
        modules: []
    };

    const moduleInputs = form.querySelectorAll('.module');
    moduleInputs.forEach((moduleInput, moduleIndex) => {
        const moduleTitle = formData.get(`modules[${moduleIndex}][title]`);
        const topicInputs = moduleInput.querySelectorAll('.topics input');
        const topics = Array.from(topicInputs).map(input => ({ title: input.value }));
        courseData.modules.push({ title: moduleTitle, topics });
    });

    try {
        const response = await fetch('http://localhost:5500/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });

        if (response.ok) {
            alert('Course added successfully!');
            form.reset();
            modulesContainer.innerHTML = '';
            moduleCount = 0;
            loadCourses();
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }
    } catch (error) {
        alert(`Error adding course: ${error.message}`);
    }
});

// Open the update modal
async function openUpdateModal(courseCode) {
    try {
        const response = await fetch(`http://localhost:5500/api/courses/${courseCode}`);
        if (!response.ok) throw new Error('Failed to fetch course details');
        const course = await response.json();

        document.getElementById('update_course_code').value = course.course_code;
        document.getElementById('update_title').value = course.title;
        document.getElementById('update_category').value = course.category;

        updateModulesContainer.innerHTML = '';
        course.modules.forEach((module, index) => {
            const moduleDiv = document.createElement('div');
            moduleDiv.classList.add('module');
            moduleDiv.innerHTML = `
                <h3>Module ${index + 1}</h3>
                <label>Module Title:</label>
                <input type="text" name="modules[${index}][title]" value="${module.title}" required>
                <div class="topics">
                    <label>Topics:</label>
                    ${module.topics.map((topic, topicIndex) => `
                        <input type="text" name="modules[${index}][topics][${topicIndex}]" value="${topic.title}" required>
                    `).join('')}
                </div>
                <button type="button" class="add-topic">Add Topic</button>
            `;
            updateModulesContainer.appendChild(moduleDiv);

            moduleDiv.querySelector('.add-topic').addEventListener('click', () => {
                const topicsDiv = moduleDiv.querySelector('.topics');
                const topicIndex = topicsDiv.children.length / 2;
                const newTopicInput = document.createElement('input');
                newTopicInput.type = 'text';
                newTopicInput.name = `modules[${index}][topics][${topicIndex}]`;
                topicsDiv.appendChild(newTopicInput);
            });
        });

        updateModal.style.display = 'block';
    } catch (error) {
        alert(`Error fetching course details: ${error.message}`);
    }
}

// Close the update modal
closeModalButton.addEventListener('click', () => {
    updateModal.style.display = 'none';
});

// Add module dynamically in the update modal
addUpdateModuleButton.addEventListener('click', () => {
    const moduleIndex = updateModuleCount++;
    const moduleDiv = document.createElement('div');
    moduleDiv.classList.add('module');
    moduleDiv.innerHTML = `
        <h3>Module ${moduleIndex + 1}</h3>
        <label>Module Title:</label>
        <input type="text" name="modules[${moduleIndex}][title]" required>
        <div class="topics">
            <label>Topics:</label>
            <input type="text" name="modules[${moduleIndex}][topics][0]" required>
        </div>
        <button type="button" class="add-topic">Add Topic</button>
    `;
    updateModulesContainer.appendChild(moduleDiv);

    moduleDiv.querySelector('.add-topic').addEventListener('click', () => {
        const topicsDiv = moduleDiv.querySelector('.topics');
        const topicIndex = topicsDiv.children.length / 2;
        const newTopicInput = document.createElement('input');
        newTopicInput.type = 'text';
        newTopicInput.name = `modules[${moduleIndex}][topics][${topicIndex}]`;
        topicsDiv.appendChild(newTopicInput);
    });
});

// Handle course updates
updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(updateForm);
    const courseCode = formData.get('course_code');
    const updatedCourse = {
        title: formData.get('title'),
        category: formData.get('category'),
        modules: []
    };

    const moduleInputs = updateModulesContainer.querySelectorAll('.module');
    moduleInputs.forEach((moduleInput, moduleIndex) => {
        const moduleTitle = formData.get(`modules[${moduleIndex}][title]`);
        const topicInputs = moduleInput.querySelectorAll('.topics input');
        const topics = Array.from(topicInputs).map(input => ({ title: input.value }));
        updatedCourse.modules.push({ title: moduleTitle, topics });
    });

    try {
        const response = await fetch(`http://localhost:5500/api/courses/${courseCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCourse),
        });

        if (response.ok) {
            alert('Course updated successfully!');
            updateModal.style.display = 'none';
            loadCourses();
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }
    } catch (error) {
        alert(`Error updating course: ${error.message}`);
    }
});

// Initial load
loadCourses();
