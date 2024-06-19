document.addEventListener("DOMContentLoaded", function () {
    const successNotification = document.getElementById('successNotification');
    const errorNotification = document.getElementById('errorNotification');
    const resultSection = document.getElementById('result'); // Get result section
    
    function showBackendUrlPopup() {
        const defaultBackendUrl = "http://localhost:3100";
        const backendUrl = prompt("Please enter the backend URL:", defaultBackendUrl);
        if (backendUrl) {
            sessionStorage.setItem("backendApiUrl", backendUrl);
            return backendUrl;
        } else {
            console.error("Backend URL not provided.");
            return null;
        }
    }
    
    // Check if backend URL is already stored in session storage
    let backendApiUrl = sessionStorage.getItem("backendApiUrl");
    
    if (!backendApiUrl) {
        // Attempt to use default backend URL
        backendApiUrl = "http://localhost:3100";
        fetch(backendApiUrl, { method: 'HEAD' })
            .then(() => {
                sessionStorage.setItem("backendApiUrl", backendApiUrl);
            })
            .catch(() => {
                // If default backend URL is not reachable, show popup to get backend URL and store it
                backendApiUrl = showBackendUrlPopup();
            });
    }
    
    // Function to show success notification
    function showSuccessNotification(message) {
        successNotification.textContent = message;
        successNotification.classList.remove('d-none');
        setTimeout(() => {
            successNotification.classList.add('d-none');
        }, 5000); // Hide after 5 seconds
    }

    // Function to show error notification
    function showErrorNotification(message) {
        errorNotification.textContent = message;
        errorNotification.classList.remove('d-none');
        setTimeout(() => {
            errorNotification.classList.add('d-none');
        }, 5000); // Hide after 5 seconds
    }

    // Function to update result section with colored output
    function updateResultSection(message, isSuccess) {
        resultSection.textContent = message;
        console.log('Classes before update:', resultSection.classList.toString());
        resultSection.className = 'card rounded-lg shadow-sm p-2 mb-2'; // Reset all classes
        if (isSuccess) {
            resultSection.classList.add('bg-success', 'text-white');
        } else {
            resultSection.classList.add('bg-danger', 'text-white');
        }
    }

    // Fetch GitHub user profile and display it
    fetch(backendApiUrl+"/github-profile")
        .then(response => response.json())
        .then(data => {
            const usernameElement = document.getElementById("githubUsername");
            const avatarElement = document.getElementById("githubAvatar");
            if (data.username && data.avatarUrl) {
                usernameElement.innerText = data.username;
                avatarElement.src = data.avatarUrl;
                avatarElement.alt = `${data.username}'s profile picture`;
                avatarElement.style.display = "inline"; // Ensure it's visible
            } else {
                usernameElement.innerText = "GitHub User: Not Found";
                avatarElement.style.display = "none";
            }
        })
        .catch(error => {
            console.error("Error fetching GitHub profile:", error);
            const usernameElement = document.getElementById("githubUsername");
            usernameElement.innerText = "Failed to load GitHub profile";
            const avatarElement = document.getElementById("githubAvatar");
            avatarElement.style.display = "none";
        });

    // Fetch GitHub repository info and display it
    fetch(backendApiUrl+"/github-repo")
        .then(response => response.json())
        .then(data => {
            const repoElement = document.getElementById("githubRepo");
            if (data.repoName && data.repoLink) {
                repoElement.innerHTML = `Repository: <a href="${data.repoLink}" target="_blank">${data.repoLink}</a>`;
            } else {
                repoElement.innerText = "GitHub Repository: Not Found";
            }
        })
        .catch(error => {
            console.error("Error fetching GitHub repo:", error);
            const repoElement = document.getElementById("githubRepo");
            repoElement.innerText = "Failed to load GitHub repository";
        });

    // Function to fetch and display changed files
    function fetchAndDisplayChangedFiles() {
        fetch(backendApiUrl+"/changed-files")
            .then(response => response.json())
            .then(data => {
                const changedFilesList = document.getElementById("changedFilesList");
                if (data.files && data.files.length) {
                    const filesHTML = data.files.map(file => {
                        const isDirectory = file.isDirectory;
                        return `
                            <div class="custom-control custom-switch">
                                <input class="custom-control-input" type="checkbox" id="file-${file.filePath}" data-file="${file.filePath}" ${isDirectory ? 'data-is-directory="true"' : ''}>
                                <label class="custom-control-label" for="file-${file.filePath}">${file.filePath} (${file.status})</label>
                            </div>
                        `;
                    }).join('');
    
                    changedFilesList.innerHTML = filesHTML;
                } else {
                    changedFilesList.innerHTML = "No changed files found.";
                }
            })
            .catch(error => {
                console.error("Error fetching changed files:", error);
                const changedFilesList = document.getElementById("changedFilesList");
                changedFilesList.innerText = "Failed to load changed files";
            });
    }

// Initial call to fetch and display changed files
fetchAndDisplayChangedFiles();

// Example of calling the function periodically every 30 seconds
setInterval(fetchAndDisplayChangedFiles, 30000);
    // Add event listener for adding selected files
    document.getElementById("addSelectedFilesButton").addEventListener("click", async function () {
        const selectedFiles = Array.from(document.querySelectorAll('#changedFilesList input:checked'))
            .map(checkbox => ({
                filePath: checkbox.getAttribute("data-file"),
                isDirectory: checkbox.hasAttribute("data-is-directory")
            }));
    
        if (selectedFiles.length === 0) {
            alert("Please select at least one file or directory to add.");
            return;
        }
    
        try {
            // Send selected files and directories to the backend
            const response = await fetch(backendApiUrl+"/add-files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ files: selectedFiles }),
            });
    
            const result = await response.json();
            if (response.ok) {
                showSuccessNotification(result.message || "Files and directories added successfully!");
                updateResultSection(result.message || "", true); // Update result section with success
            } else {
                showErrorNotification(result.error || "Failed to add files and directories.");
                updateResultSection(result.error || "", false); // Update result section with error
            }
        } catch (error) {
            console.error("Error:", error);
            showErrorNotification("Failed to add files and directories.");
            updateResultSection("Failed to add files and directories.", false); // Update result section with error
        }
    });
    

    // Select All button functionality
    document.getElementById("selectAllButton").addEventListener("click", function () {
        document.querySelectorAll('#changedFilesList input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    // Uncheck All button functionality
    document.getElementById("uncheckAllButton").addEventListener("click", function () {
        document.querySelectorAll('#changedFilesList input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    // Event listener to set current date and time when "Now" button is clicked
    document.getElementById("nowButton").addEventListener("click", function () {
        const now = new Date();
        const formattedDate = formatDate(now);
        document.getElementById("commitDate").value = formattedDate;
    });
    // Event listener to set current date and time when "Now" button is clicked
    document.getElementById("fetchLastCommitTime").addEventListener("click",async function () {
        try {
            // Fetch the last commit date from the server
            const response = await fetch(backendApiUrl+"/last-commit-date");
            const result = await response.json();

            if (response.ok) {
                const lastCommitDate = new Date(result.lastCommitDate);
                const formattedDate = formatDate(lastCommitDate);
                document.getElementById("commitDate").value = formattedDate;
            } else {
                console.error(result.error || "Failed to fetch the last commit date.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

    // Function to format date as YYYY-MM-DD HH:MM:SS
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Handle commit form submission
    document.getElementById("commitForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const commitMessage = document.getElementById("commitMessage").value;
        const commitDate = document.getElementById("commitDate").value;

        try {
            const response = await fetch(backendApiUrl+"/commit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commitMessage,
                    commitDate,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                showSuccessNotification(result.message || "Commit created successfully!");
                updateResultSection(result.message+" Output :  "+result.output || "", true); // Update result section with success
            } else {
                showErrorNotification(result.error || "Failed to create commit.");
                updateResultSection(result.error || "", false); // Update result section with error
            }
        } catch (error) {
            console.error("Error:", error);
            showErrorNotification("Failed to create commit.");
            updateResultSection("Failed to create commit.", false); // Update result section with error
        }
    });

    // Handle push button click
    document.getElementById("pushButton").addEventListener("click", async function () {
        try {
            const response = await fetch(backendApiUrl+"/push", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            const result = await response.json();
            if (response.ok) {
                showSuccessNotification(result.message || "Changes pushed successfully!");
                updateResultSection(result.message || "", true); 
                fetchLastCommitDate();// Update result section with success
                fetchAndDisplayChangedFiles();
            } else {
                showErrorNotification(result.error || "Failed to push changes.");
                updateResultSection(result.error || "", false); // Update result section with error
            }
        } catch (error) {
            console.error("Error:", error);
            showErrorNotification("Failed to push changes.");
            updateResultSection("Failed to push changes.", false); // Update result section with error
        }
    });

    // Function to fetch and display last commit date
    function fetchLastCommitDate() {
        fetch(backendApiUrl+"/last-commit-date")
            .then(response => response.json())
            .then(data => {
                const lastCommitDateElement = document.getElementById("lastCommitDate");
                if (data.lastCommitDate) {
                    const formattedDate = formatDate(new Date(data.lastCommitDate));
                    lastCommitDateElement.innerText = formattedDate;
                } else {
                    lastCommitDateElement.innerText = "Last Commit Date: Not Available";
                }
            })
            .catch(error => {
                console.error("Error fetching last commit date:", error);
                const lastCommitDateElement = document.getElementById("lastCommitDate");
                lastCommitDateElement.innerText = "Failed to load last commit date";
            });
    }
    fetchLastCommitDate();

    // Disconnect Button Event Listener
document.getElementById('disconnectButton').addEventListener('click', async function() {
    // Call the backend to destroy the session
    try {
        sessionStorage.clear();
        showBackendUrlPopup();
        window.location.reload();

        // const response = await fetch(backendApiUrl+"/disconnect", {
        //     method: 'POST',
        // });

        // if (response.ok) {
        //     // Successfully disconnected
        //     alert('Successfully disconnected.');
        //     // Optionally, clear the UI or redirect the user to a login page
        //     location.reload(); // Refresh the page to reset the UI
        // } else {
        //     // Handle errors
        //     alert('Failed to disconnect. Please try again.');
        // }
    } catch (error) {
        console.error('Error during disconnect:', error);
        alert('An error occurred. Please try again.');
    }
});


flatpickr("#commitDate", {
    enableTime: true,
    dateFormat: "Y-m-d H:i:S",
    time_24hr: true,
    inline: false,
    allowInput: true, // Allow manual input
});

});
