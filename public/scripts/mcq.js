const userResponses = []
let timerInterval
let questionsData = []

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("submit-btn").addEventListener("click", submitTest)
    loadQuestions()
})

async function loadQuestions() {
    const loadingScreen = document.getElementById("loading-screen");
    const testContainer = document.querySelector(".test-container");
    const submitBtn = document.getElementById("submit-btn");

    loadingScreen.style.display = "flex";
    testContainer.style.display = "none";
    submitBtn.style.display = "none";

    try {
        const response = await fetch("/api/generate-mcqs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: "Web Development", questionType: "MCQ", count: 10 }),
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        questionsData = data;

        // Simulate a minimum loading time of 2 seconds for better UX
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Hide loading screen and show test
        loadingScreen.style.display = "none";
        testContainer.style.display = "block";
        submitBtn.style.display = "block";

        // Start timer only after questions are loaded
        startTimer(900);
        renderQuestions(data);
    } catch (error) {
        console.error("Failed to load questions:", error);
        const loadingContent = document.querySelector(".loading-content");
        loadingContent.innerHTML = `
            <div class="error-message">
                <h2>⚠️ Oops!</h2>
                <p>Failed to load questions. Please refresh the page to try again.</p>
            </div>
        `;
    }
}

// Define the missing submitTest function
async function submitTest() {
    clearInterval(timerInterval)
    try {
        const response = await fetch("/api/validate-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                responses: userResponses,
                questions: questionsData,
            }),
        })

        const results = await response.json()
        showResults(results)
    } catch (error) {
        console.error("Submission failed:", error)
    }
}

// Updated renderQuestions function
function renderQuestions(questions) {
    const container = document.getElementById("questions-container")
    container.innerHTML = ""
    userResponses.length = 0  // Reset the responses array

    questions.forEach((q, index) => {
        const questionDiv = document.createElement("div")
        questionDiv.className = "question"
        let contentHTML = `<h3>Q${index + 1}: ${q.question || q.problemStatement}</h3>`

        if (q.sampleInput) {
            contentHTML += `
        <div class="code-sample">
          <pre><code>${q.sampleInput}</code></pre>
        </div>
      `
        }

        // If the question type is "text", or if no valid options array is provided, render a text input
        if ((q.type && q.type.toLowerCase() === "text") || !Array.isArray(q.options)) {
            contentHTML += `
        <div class="options">
          <input type="text" name="q${index}" placeholder="Your answer here">
        </div>
      `
            questionDiv.innerHTML = contentHTML
            const textInput = questionDiv.querySelector('input[type="text"]')
            textInput.addEventListener("change", (e) => {
                userResponses[index] = e.target.value
            })
        } else {
            // Otherwise, assume options exist and render radio buttons
            const optionsHTML = q.options.map((opt, i) => `
        <label>
          <input type="radio" name="q${index}" value="${i}">
          ${opt}
        </label>
      `).join("")
            contentHTML += `<div class="options">${optionsHTML}</div>`
            questionDiv.innerHTML = contentHTML
            questionDiv.querySelectorAll('input[type="radio"]').forEach((input) => {
                input.addEventListener("change", (e) => {
                    userResponses[index] = Number.parseInt(e.target.value)
                })
            })
        }
        container.appendChild(questionDiv)
    })
}


// Updated showResults function
function showResults(results) {
    const container = document.getElementById("results-container")
    const resultsArray = results.results || results // Handle both response structures

    container.innerHTML = `
        <h2>Score: ${results.score}/${results.total} (${results.percentage}%)</h2>
        <div class="results-grid">
            ${resultsArray.map((r, i) => `
                <div class="result-item ${r.isCorrect ? "correct" : "incorrect"}">
                    <h3>Q${i + 1}: ${r.question}</h3>
                    <p>Your answer: ${r.userAnswer}</p>
                    <p>Correct answer: ${r.correctAnswer}</p>
                    <p class="explanation">${r.explanation}</p>
                </div>
            `).join("")}
        </div>
    `

    // Animate results
    setTimeout(() => {
        document.querySelectorAll(".result-item").forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = "1"
                item.style.transform = "translateY(0)"
            }, index * 100)
        })
    }, 100)

    document.getElementById("questions-container").style.display = "none"
    document.getElementById("submit-btn").style.display = "none"
}

// Example startTimer function (if not already defined)
function startTimer(seconds) {
    let remaining = seconds
    timerInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60)
        const secs = remaining % 60
        document.getElementById("timer").textContent =
            `${mins}:${secs.toString().padStart(2, "0")}`
        if (--remaining < 0) {
            clearInterval(timerInterval)
            submitTest()
        }
    }, 1000)
}
