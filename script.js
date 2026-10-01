// --- THEME SWITCHER ---

// This themes object contains the definitions for the dark and light themes, including their respective colors, background images, logos, icons, and other UI elements. Each theme has a label for display purposes and a swatch color for visual representation in the theme switcher.
const themes = {
  dark: {
    label: "Dark",
    swatch: "#161616",
    bg: "url('images/pomodoro_background.png')",
    logo: "images/SITELogo_white.png",
    icon: "images/palette_white.png",
    resetIcon: "images/reset.png",
    backIcon: "images/arrow_forward.png",
    colors: {
      "--bg": "#161616",
      "--card": "#262626",
      "--pill": "#333",
      "--text": "#f2f2f2",
      "--muted": "#8a8a8a",
      "--btn-text": "#111111",
      "--btn-hover": "#ffffff",
      "--btn-text-hover": "#111111",
      "--edit-glow": "#424242",
    },
  },
  light: {
    label: "Light",
    swatch: "#e0e0e0",
    bg: "url('images/background_white.png')",
    logo: "images/Asset_SITE_logo.png",
    icon: "images/palette_black.png",
    resetIcon: "images/reset_black.png",
    backIcon: "images/arrow_forward_black.png",
    colors: {
      "--bg": "#cccccc",
      "--card": "#EEEEEE",
      "--pill": "#e0e0e0",
      "--text": "#3f3d3d",
      "--muted": "#777",
      "--btn-text": "#FFFFFF",
      "--btn-hover": "#fafafa",
      "--btn-text-hover": "#111111",
      "--edit-glow": "#e0e0e0",
    },
  },
};

// The applyTheme function takes a theme name as an argument and applies the corresponding theme to the website.
//  It updates the CSS variables, background image, logo, icons, and active state of the theme swatches.
// It also saves the selected theme in localStorage for persistence across sessions.

function applyTheme(name) {
  const t = themes[name]; // Get the theme object based on the provided name ("dark" or "light")
  if (!t) return; // If the theme doesn't exist, exit the function

  document.documentElement.style.setProperty("--bg-image", t.bg); // Set the background image for the entire document
  Object.entries(t.colors).forEach(([key, val]) => {
    // Iterate over each color property in the theme's colors object
    document.documentElement.style.setProperty(key, val);
  });

  // Update the logo and icons based on the selected theme

  document.querySelector(".logo").src = t.logo;
  document.querySelector(".theme-btn img").src = t.icon;
  document.querySelector(".reset-btn img").src = t.resetIcon;
  document.querySelector(".back-arrow").src = t.backIcon;

  //Update the active state of the theme swatches in the theme menu

  document.querySelectorAll(".theme-swatch").forEach((sw) => {
    sw.classList.toggle("active", sw.dataset.theme === name);
  });

  // Save the selected theme in localStorage for persistence across sessions

  localStorage.setItem("siteTheme", name);
}

// Get references to the theme button and theme menu elements in the DOM (button to open the theme menu and the menu itself)

const themeBtn = document.getElementById("themeBtn");
const themeMenu = document.getElementById("themeMenu");

// Create theme swatches (buttons) for each theme defined in the themes object and append them to the theme menu
//each swatch button has a background color representing the theme, an aria-label for accessibility, and an onclick event to apply the selected theme when clicked.

Object.entries(themes).forEach(([key, t]) => {
  const sw = document.createElement("button");
  sw.type = "button";
  sw.className = "theme-swatch";
  sw.style.background = t.swatch;
  sw.dataset.theme = key;
  sw.setAttribute("aria-label", t.label);
  sw.onclick = () => {
    applyTheme(key);
    themeMenu.hidden = true;
  };
  themeMenu.appendChild(sw);
});

// Toggle the visibility of the theme menu when the theme button is clicked
themeBtn.onclick = () => {
  themeMenu.hidden = !themeMenu.hidden;
};

// Hide the theme menu when clicking outside of it

document.addEventListener("click", (e) => {
  if (!e.target.closest(".theme-wrap")) themeMenu.hidden = true;
});

applyTheme(localStorage.getItem("siteTheme") || "dark");

// --- Timer --- The following code implements a Pomodoro timer with task management functionality.
//  It allows users to switch between different timer modes (Pomodoro, short break, long break), start/pause the timer,
// edit the timer duration, and manage tasks with estimated time and completion status.

const timeEl = document.getElementById("time");
const minText = document.getElementById("minText");
const secText = document.getElementById("secText");
const startBtn = document.getElementById("startBtn");
const modeBtns = document.querySelectorAll("#modes button");
const editTitle = document.querySelector(".edit-title");
const editTitles = {
  pomodoro: "Edit Pomotime",
  short: "Edit short break time",
  long: "Edit long break time",
};

// The labels object defines the text displayed on the start button for each timer mode (Pomodoro, short break, long break).

const labels = {
  pomodoro: "Start Focus Timer",
  short: "Start Short Break",
  long: "Start Long Break",
};

const autoStartToggle = document.getElementById("autoStartToggle");

// The following variables are used to manage the timer state and track completed Pomodoro sessions.

let mode = "pomodoro";
let seconds = 25 * 60;
let timer = null;

const sessionCounter = document.getElementById("sessionCounter");

// completed focus sessions
let pomodoroCount = 0;

// Update the session counter text based on the current mode and completed Pomodoro sessions

function updateCounter() {
  const current = (pomodoroCount % 4) + 1;
  sessionCounter.textContent =
    mode === "pomodoro" ? `Session ${current} of 4` : "On a break";
}

// Request notification permission when the user clicks the start button for the first time
//if the browser supports notifications and the permission is still in the default state,
// it will prompt the user to allow notifications when they click the start button.

if ("Notification" in window && Notification.permission === "default") {
  startBtn.addEventListener("click", () => Notification.requestPermission(), {
    once: true,
  });
}

// The render function updates the timer display (minutes and seconds) on the webpage
// and also updates the document title to reflect the current timer state.

function render() {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  minText.textContent = m;
  secText.textContent = s;
  document.title = `${m}:${s} · SITE Pomodoro`;
}

// The stop function stops the timer by clearing the interval and resetting the timer variable to null.
// It also updates the start button text to reflect the current mode (Pomodoro, short break, long break).

function stop() {
  clearInterval(timer);
  timer = null;
  startBtn.textContent = labels[mode];
}

// The tick function is called every second when the timer is running.
// It decrements the remaining seconds, updates the active task's remaining time if applicable,
//  and checks if the timer has reached zero. If the timer reaches zero,
// it stops the timer, plays an alarm sound, sends a notification, resets the active task's remaining time,
//  and switches to the next mode (Pomodoro or break) based on the current mode and completed sessions.

function tick() {
  seconds--;
  if (activeTaskId !== null) {
    const active = tasks.find((x) => x.id === activeTaskId);
    if (active) active.remainingSeconds = seconds;
  }
  render();
  if (seconds <= 0) {
    stop();
    playAlarm();
    notify(
      "Time's up!",
      mode === "pomodoro" ? "Take a break." : "Back to focus.",
    );
    const finished = tasks.find((x) => x.id === activeTaskId);
    if (finished) finished.remainingSeconds = null; // back to full time next time
    activeTaskId = null;
    save();
    renderTasks();
    autoSwitch();
  }
}

// The switchTo function switches the timer to a new mode (Pomodoro, short break, long break).
// It updates the mode variable, the edit title, the active state of the mode buttons,
// and sets the remaining seconds based on the selected mode's duration.
// It also calls the render and updateCounter functions to update the timer display and session counter.

function switchTo(newMode) {
  mode = newMode;
  editTitle.textContent = editTitles[mode];
  modeBtns.forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === newMode),
  );
  const btn = document.querySelector(`.modes button[data-mode="${newMode}"]`);
  seconds = Number(btn.dataset.min) * 60;
  render();
  updateCounter();
}

// The autoSwitch function is called when the timer reaches zero and automatically switches to the next mode.
// If the current mode is Pomodoro, it increments the completed Pomodoro count and switches to a short or long break based on the count.
// If the current mode is a break, it switches back to Pomodoro. It also starts the timer automatically if the auto-start toggle is enabled.

function autoSwitch() {
  if (mode === "pomodoro") {
    pomodoroCount++;
    switchTo(pomodoroCount % 4 === 0 ? "long" : "short");
  } else {
    switchTo("pomodoro");
  }
  startBtn.textContent = labels[mode];

  if (autoStartToggle.checked) {
    timer = setInterval(tick, 1000);
    startBtn.textContent = "Pause";
  }
}

// The following code sets up the event listeners for the start button and mode buttons.

// The start button toggles the timer between running and paused states.

startBtn.onclick = () => {
  alarmSound.load();
  timeEl.classList.remove("editing");
  if (timer) {
    stop();
    startBtn.textContent = "Resume";
    return;
  }
  if (seconds <= 0) return;
  timer = setInterval(tick, 1000);
  startBtn.textContent = "Pause";
};

// The mode buttons allow the user to switch between different timer modes (Pomodoro, short break, long break).

modeBtns.forEach((btn) => {
  btn.onclick = () => {
    mode = btn.dataset.mode;
    editTitle.textContent = editTitles[mode];
    stop();
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    seconds = btn.dataset.min * 60;
    render();
    updateCounter(); // new line
  };
});

// The following code handles the alarm sound and notifications when the timer reaches zero.

const alarmSound = document.getElementById("alarmSound");

// The playAlarm function plays the alarm sound when the timer reaches zero.
// It resets the current time of the audio element to 0 before playing to ensure it starts from the beginning.

function playAlarm() {
  alarmSound.currentTime = 0;
  alarmSound.play().catch(() => {});
}

// The notify function sends a browser notification with the specified title and body.
// It checks if the Notification API is supported in the browser and if the user has granted permission for notifications.

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// --- Add Task ---

const taskList = document.getElementById("taskList");
const emptyEl = document.getElementById("empty");
const pastBtn = document.getElementById("pastBtn");
const addBtn = document.getElementById("addBtn");

const overlay = document.getElementById("taskModalOverlay");
const modalTitleInput = document.getElementById("modalTitleInput");
const modalTitleCount = document.getElementById("modalTitleCount");
const modalSubtitleInput = document.getElementById("modalSubtitleInput");
const modalEstimateInput = document.getElementById("modalEstimateInput");
const modalEstimateUnit = document.getElementById("modalEstimateUnit");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalAddBtn = document.getElementById("modalAddBtn");

// The following code handles the character count for the task title input in the modal.
// It updates the character count display and applies a "limit" class when the title reaches the maximum length of 40 characters.

modalTitleInput.addEventListener("input", () => {
  const len = modalTitleInput.value.length;
  modalTitleCount.textContent = `${len}/40`;
  modalTitleCount.classList.toggle("limit", len >= 40);
});

// The openModal function is called when the user clicks the "Add Task" button.
// It resets the modal input fields, shows the overlay, and focuses on the title input.
// The closeModal function hides the overlay when the user clicks the cancel button or outside the modal.

function openModal() {
  modalTitleInput.value = "";
  modalSubtitleInput.value = "";
  modalEstimateInput.value = "25";
  modalEstimateUnit.value = "min";
  modalTitleCount.textContent = "0/40";
  overlay.hidden = false;
  modalTitleInput.focus();
}

// The closeModal function hides the task modal overlay when called.
//  It is triggered when the user clicks the cancel button or clicks outside the modal area.

function closeModal() {
  overlay.hidden = true;
}

// The following code sets up event listeners for opening and closing the task modal.

addBtn.onclick = openModal;
modalCancelBtn.onclick = closeModal;
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

// The randomAccent function generates a random accent color for tasks based on the current theme (light or dark).
// It uses the HSL color model to create a random hue and adjusts the saturation and lightness based on the theme.
// In light mode, it generates darker tones, while in dark mode, it generates pastel tones.

function randomAccent() {
  const hue = Math.floor(Math.random() * 360);
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  return isLight
    ? `hsl(${hue}, 55%, 22%)` // darker tones for light mode
    : `hsl(${hue}, 70%, 80%)`; // pastel tones for dark mode
}

// The following code handles the addition of a new task when the user clicks the "Add" button in the task modal.
// It validates the title input, calculates the estimated time in minutes based on the user's input and selected unit (minutes or hours),
// and creates a new task object with a unique ID, title, subtitle, estimated time, random accent color, and completion status.
// The new task is then added to the tasks array, saved to localStorage, and the task list is re-rendered. Finally, the modal is closed.

modalAddBtn.onclick = () => {
  const title = modalTitleInput.value.trim();
  if (!title) {
    modalTitleInput.focus();
    return;
  }

  const amount = Math.max(1, Number(modalEstimateInput.value) || 25);
  const estimateMinutes =
    modalEstimateUnit.value === "hr" ? amount * 60 : amount;

  // Create a new task object with a unique ID, title, subtitle, estimated time, random accent color, and completion status.
  tasks.push({
    id: Date.now(),
    title,
    subtitle: modalSubtitleInput.value.trim(),
    estimateMinutes,
    accent: randomAccent(),
    done: false,
  });

  showPast = false;
  save();
  renderTasks();
  closeModal();
};

// The formatEstimate function takes a number of minutes as input and returns a formatted string representing the estimated time.
// It handles different cases: if the time is a whole hour, it returns "X hr"; if it's more than an hour, it returns "Xh Ym"; otherwise, it returns "X min".

function formatEstimate(mins) {
  if (mins % 60 === 0) return `${mins / 60} hr`;
  if (mins > 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins} min`;
}

// The following code manages the active task state and handles starting the timer for a specific task.

// When a task is started, it saves the remaining time of the previously active task (if any) before switching to the new task.
// It stops the current timer, sets the mode to "pomodoro", updates the UI to reflect the active task, and starts the timer for the selected task.
// It also updates the activeTaskId variable to keep track of the currently active task and saves the tasks to localStorage.

let activeTaskId = null;

// The startTaskTimer function is called when the user clicks the "Start" button for a specific task.
// It handles the logic for starting the timer for that task, including saving the remaining time of the previously active task (if any), stopping the current timer, updating the UI, and starting the timer for the selected task.

function startTaskTimer(task) {
  // save the currently running task's remaining time before switching
  if (activeTaskId !== null && activeTaskId !== task.id) {
    const prev = tasks.find((x) => x.id === activeTaskId);
    if (prev) prev.remainingSeconds = seconds;
  }

  stop();
  mode = "pomodoro";
  modeBtns.forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === "pomodoro"),
  );
  editTitle.textContent = editTitles.pomodoro;

  seconds =
    task.remainingSeconds != null
      ? task.remainingSeconds
      : task.estimateMinutes * 60;
  render();
  updateCounter();
  startBtn.click();

  activeTaskId = task.id;
  save();
  renderTasks();
}

// The following code manages the task list, including rendering tasks, handling task completion, deletion,
//  and toggling between current and past tasks
// It also handles saving tasks to localStorage and updating the UI based on the current state of tasks.
// The tasks array is initialized by retrieving the stored tasks from localStorage (if any) or starting with an empty array.

let tasks = JSON.parse(localStorage.getItem("siteTasks") || "[]");
let showPast = false;

// The save function saves the current tasks array to localStorage as a JSON string.

function save() {
  localStorage.setItem("siteTasks", JSON.stringify(tasks));
}

// The renderTasks function is responsible for rendering the task list on the webpage.
// It filters the tasks based on their completion status (current or past) and creates list items for each visible task.
// It sets up event listeners for task completion, deletion, and starting the timer for a specific task.
// It also updates the UI to show or hide the empty state message based on the number of visible tasks.

function renderTasks() {
  taskList.innerHTML = "";
  const visible = tasks.filter((t) => t.done === showPast);

  visible.forEach((t) => {
    const subtitle = t.subtitle || "";
    const full = subtitle ? `${t.title}. ${subtitle}` : t.title;

    const li = document.createElement("li");
    if (t.done) li.className = "done";
    li.style.setProperty("--accent", t.accent || "var(--muted)");

    li.innerHTML = `
      <input class="task-check" type="checkbox">
      <div class="task-text">
        <div class="task-title"></div>
        <div class="task-sub"></div>
      </div>
      <span class="task-estimate"></span>
      ${t.done ? "" : '<button class="task-start" type="button">Start</button>'}
      <button class="task-delete" type="button" aria-label="Delete task">×</button>`;

    li.querySelector(".task-title").textContent = t.title;
    li.querySelector(".task-sub").textContent = subtitle;
    li.querySelector(".task-text").title = full;
    li.querySelector(".task-estimate").textContent = formatEstimate(
      t.estimateMinutes || 25,
    );

    // The following code sets up the "Start" button for each task in the task list.
    // It checks if the task is currently active and updates the button text and disabled state accordingly.

    const startBtnEl = li.querySelector(".task-start");
    if (startBtnEl) {
      startBtnEl.onclick = () => startTaskTimer(t);

      if (t.id === activeTaskId) {
        startBtnEl.textContent = "In Progress";
        startBtnEl.disabled = true;
      } else if (
        t.remainingSeconds != null &&
        t.remainingSeconds < t.estimateMinutes * 60
      ) {
        startBtnEl.textContent = "Resume";
      }
    }

    // The following code sets up the checkbox for each task in the task list.
    // It updates the task's completion status when the checkbox is changed and re-renders the task list.
    // It also sets the aria-label for accessibility, indicating the action of marking the task as done.

    const check = li.querySelector(".task-check");
    check.checked = t.done;
    check.setAttribute("aria-label", `Mark as done: ${full}`);
    check.onchange = () => {
      t.done = !t.done;
      save();
      renderTasks();
    };

    // The following code sets up the "Delete" button for each task in the task list.
    // It checks if the task being deleted is currently active and stops the timer if necessary.
    // It then removes the task from the tasks array, saves the updated tasks to localStorage, and re-renders the task list.
    li.querySelector(".task-delete").onclick = () => {
      if (t.id === activeTaskId) {
        stop();
        seconds =
          Number(document.querySelector(".modes button.active").dataset.min) *
          60;
        render();
        activeTaskId = null;
      }
      tasks = tasks.filter((x) => x !== t);
      save();
      renderTasks();
    };

    taskList.appendChild(li);
  });

  // The following code updates the visibility of the empty state message based on the number of visible tasks.
  // It also updates the text of the empty state message based on whether the user is viewing past tasks or current tasks.

  emptyEl.style.display = visible.length ? "none" : "block";
  emptyEl.textContent = showPast ? "No past tasks yet" : "No tasks listed yet";
  pastBtn.classList.toggle("active", showPast);
  pastBtn.textContent = showPast ? "Current Tasks" : "Past Tasks";
}

// The following code sets up the event listener for the "Past Tasks" button.
pastBtn.onclick = () => {
  showPast = !showPast;
  renderTasks();
};

renderTasks();

// --- Fullscreen ---

const fullscreenBtn = document.getElementById("fullscreenBtn");

// The following code sets up the event listener for the fullscreen button.
// It toggles the fullscreen mode of the document when the button is clicked.
// If the document is not currently in fullscreen mode, it requests fullscreen for the entire document.
// If the document is already in fullscreen mode, it exits fullscreen.

fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// --- Edit Time ---

// The following code handles the editing of the timer duration by allowing users to click on the timer display and enter edit mode.

function selectAll(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

// The setEditable function sets the contentEditable property of the minute and second text elements based on the provided boolean value (on).
// It allows users to edit the timer duration by making the text elements editable when entering edit mode and non-editable when exiting edit mode.
// The readTyped function reads the user-typed values for minutes and seconds, validates them, and updates the timer duration accordingly.

function setEditable(on) {
  minText.contentEditable = on;
  secText.contentEditable = on;
}

// turns the typed digits into the real time
function readTyped() {
  const m = Math.min(180, Number(minText.textContent) || 0);
  let s = Math.min(59, Number(secText.textContent) || 0);
  if (m === 180) s = 0; // the maximum is 180:00
  seconds = m * 60 + s;
  render();
}

// The exitEdit function is called when the user clicks outside the timer display or clicks the "Done" button.
// It checks if the timer display is currently in edit mode and, if so, reads the user-typed values, sets the text elements to non-editable, and removes the "editing" class from the timer display.
// This function ensures that the timer duration is updated based on the user's input and exits edit mode gracefully.

function exitEdit() {
  if (!timeEl.classList.contains("editing")) return;
  readTyped();
  setEditable(false);
  timeEl.classList.remove("editing");
}

// typing rules: numbers only, 3 digits for minutes, 2 for seconds
[
  [minText, 3],
  [secText, 2],
].forEach(([el, max]) => {
  el.addEventListener("focus", () => setTimeout(() => selectAll(el), 0));

  el.addEventListener("input", () => {
    const clean = el.textContent.replace(/\D/g, "").slice(0, max);
    if (clean !== el.textContent) {
      el.textContent = clean;
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false); // keep the cursor at the end
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }
  });

  // pressing Enter while editing will exit edit mode
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      exitEdit();
    }
  });
});

// click the time to enter edit mode, and use the + / − buttons
timeEl.addEventListener("click", (e) => {
  if (timer) return; // no editing while the timer is running

  // If the user clicks on a button with the class "adj" (adjustment buttons for minutes or seconds),
  //  it reads the current typed values, calculates the adjustment step based on the button's data attributes
  // (step and unit), updates the timer duration accordingly, and re-renders the timer display.
  const btn = e.target.closest(".adj");
  if (btn) {
    readTyped(); // keep whatever the user already typed
    const step =
      Number(btn.dataset.step) * (btn.dataset.unit === "min" ? 60 : 1);
    seconds = Math.min(180 * 60, Math.max(0, seconds + step));
    render();
  }

  // If the user clicks on the timer display itself (not on an adjustment button), it enters edit mode by adding the "editing" class to the timer display,
  // setting the text elements to be editable, and focusing on the minutes text element if the user didn't click on a button.
  if (!timeEl.classList.contains("editing")) {
    timeEl.classList.add("editing");
    setEditable(true);
    if (!btn) minText.focus();
  }
});

// click anywhere outside the time (including Done) to leave edit mode
document.addEventListener("click", (e) => {
  if (!e.target.closest("#time")) exitEdit();
});

// The following code sets up the event listener for the "Done" button in the timer edit mode.
document.getElementById("doneBtn").onclick = exitEdit;

// The following code sets up the event listener for the "Reset" button in the timer interface.
// When the user clicks the "Reset" button, it stops the timer, resets the timer duration to the default value based on the currently active mode,
const resetBtn = document.getElementById("resetBtn");

// The reset button also clears the remaining time of the currently active task (if any), resets the activeTaskId to null, saves the updated tasks to localStorage, and re-renders the task list to reflect the changes.
// This ensures that the timer and task states are reset to their initial values when the user chooses to reset the timer.

resetBtn.onclick = () => {
  stop();
  seconds =
    Number(document.querySelector(".modes button.active").dataset.min) * 60;
  render();

  const active = tasks.find((x) => x.id === activeTaskId);
  if (active) active.remainingSeconds = null;

  activeTaskId = null;
  save();
  renderTasks();
};
render();
renderTasks();

// The following code sets up a global event listener for keydown events on the document.
// It handles keyboard shortcuts for controlling the timer and editing the timer duration.

document.addEventListener("keydown", (e) => {
  const typing =
    document.activeElement === minText ||
    document.activeElement === secText ||
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA";

  // Up / Down arrows adjust the time, but only while editing
  if (typing && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    e.preventDefault();
    const unit = document.activeElement === minText ? "min" : "sec";
    const amount = unit === "min" ? 1 : 5;
    const step = e.key === "ArrowUp" ? amount : -amount;
    readTyped();
    seconds = Math.min(
      180 * 60,
      Math.max(0, seconds + (unit === "min" ? step * 60 : step)),
    );
    render();
    return;
  }

  if (typing) return; // let normal typing happen, ignore shortcuts below

  if (e.code === "Space") {
    e.preventDefault();
    startBtn.click();
  }

  if (e.key.toLowerCase() === "r") {
    resetBtn.click();
  }
});
