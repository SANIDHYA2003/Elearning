document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the logged-in user from localStorage.
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
        // Redirect to home if no user is logged in.
        window.location.href = '/';
    }

    // Fetch user data and load enrolled courses.
    fetchUserData();
    loadEnrolledCourses();

    // Form submission handler for updating profile details.
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });

    // Photo upload handler: updates the profile picture.
    document.getElementById('photoUpload').addEventListener('change', function (e) {
        const reader = new FileReader();
        reader.onload = function (event) {
            // Update the image preview.
            document.getElementById('profileImage').src = event.target.result;
            // Update the profile photo on the server.
            updateProfilePhoto(event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
    });
});

// Function to fetch the user's data from the server and populate the form fields.
async function fetchUserData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    try {
        const response = await fetch(`/api/user/${user._id}`);
        const userData = await response.json();

        // Populate form fields with fetched data.
        document.getElementById('name').value = userData.name;
        document.getElementById('email').value = userData.email;
        document.getElementById('organization').value = userData.organization || '';
        document.getElementById('phone').value = userData.phone || '';

        // Set the profile image if available.
        if (userData.photo) {
            document.getElementById('profileImage').src = userData.photo;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Function to handle profile updates.
async function updateProfile() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const updates = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        organization: document.getElementById('organization').value,
        phone: document.getElementById('phone').value,
    };

    try {
        const response = await fetch(`/api/user/${user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            // Update localStorage with the new details.
            localStorage.setItem('loggedInUser', JSON.stringify({ ...user, ...updatedUser }));
            alert('Profile updated successfully!');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

// Function to update the profile photo.
async function updateProfilePhoto(photoData) {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    try {
        const response = await fetch(`/api/user/${user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: photoData })
        });

        if (response.ok) {
            const updatedUser = await response.json();
            localStorage.setItem('loggedInUser', JSON.stringify({ ...user, ...updatedUser }));
        }
    } catch (error) {
        console.error('Error updating photo:', error);
    }
}

// Function to load the courses in which the user is enrolled.
async function loadEnrolledCourses() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    try {
        const response = await fetch(`/api/user/${user._id}`);
        const userData = await response.json();
        const coursesList = document.getElementById('coursesList');

        if (!userData.enrolledCourses || userData.enrolledCourses.length === 0) {
            coursesList.innerHTML = `<p>You're not enrolled in any courses yet.</p>`;
            return;
        }

        // Fetch details for each enrolled course.
        const courses = await Promise.all(
            userData.enrolledCourses.map(async enrollment => {
                const courseRes = await fetch(`/api/courses/by-id/${enrollment.courseId}`);
                return courseRes.ok ? await courseRes.json() : null;
            })
        );

        coursesList.innerHTML = courses
            .filter(course => course !== null)
            .map(course => `
          <div class="course-card">
              <h3>${course.title}</h3>
              <p>Course Code: ${course.course_code}</p>
          </div>`
            ).join('');
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
        document.getElementById('coursesList').innerHTML = `<p>Error loading courses. Please try again later.</p>`;
    }
}
