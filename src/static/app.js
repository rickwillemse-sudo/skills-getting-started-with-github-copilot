document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants.length > 0
          ? details.participants.map(p => `<li>${p}</li>`).join('')
          : '<li><em>No participants yet</em></li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Participants list
        const participantsList = document.createElement("ul");
        participantsList.className = "participants";

        details.participants.forEach((email) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span class="participant-email">${email}</span>
            <button class="delete-participant" data-activity="${name}" data-email="${email}" title="Unregister">✖</button>
          `;
          participantsList.appendChild(li);
        });

        activityCard.appendChild(participantsList);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh the activities list so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  // Delegate click events for unregister buttons
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-participant");
    if (!btn) return;

    const activity = btn.getAttribute("data-activity");
    const email = btn.getAttribute("data-email");

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await resp.json();
      if (resp.ok) {
        // Remove the participant from the UI
        const li = btn.closest("li");
        if (li) li.remove();

        // Update spots left display
        const card = btn.closest(".activity-card");
        if (card) {
          const spotsSpan = card.querySelector(".spots-left");
          if (spotsSpan) {
            // Recompute from DOM: count remaining lis
            const participants = card.querySelectorAll(".participants li").length;
            const max = parseInt(card.querySelector(".spots-left").textContent, 10);
            // We don't have max stored; instead recompute using activities currently loaded by refetch
            // Simpler: refetch activities to ensure UI consistent
            fetchActivities();
          }
        }
      } else {
        console.error("Failed to unregister:", result);
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
    }
  });

  // Load activities
  fetchActivities();
});
