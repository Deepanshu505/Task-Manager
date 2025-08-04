// TaskFlow - Collaborative Task Management Application
// Modern JavaScript implementation with drag-and-drop, real-time updates, and team collaboration

class TaskFlowApp {
  constructor() {
    this.currentUser = null;
    this.currentView = "kanban";
    this.tasks = [];
    this.users = [];
    this.columns = [];
    this.activities = [];
    this.filters = {
      priority: "",
      assignee: "",
      search: "",
    };
    this.draggedTask = null;
    this.theme = localStorage.getItem("taskflow-theme") || "light";
    this.searchTimeout = null;
    this.isInitialized = false;
  }

  // Initialize the application
  async init() {
    console.log("Initializing TaskFlow...");

    // Immediately hide any visible drag overlay
    this.hideDragOverlay();

    try {
      // Show loading spinner
      this.showLoadingSpinner();

      // Initialize data first
      await this.initializeData();
      console.log("Data initialized");

      // Set theme early
      this.setTheme(this.theme);
      console.log("Theme set");

      // Set up event listeners
      await this.setupEventListeners();
      console.log("Event listeners set up");

      // Set up real-time updates
      this.setupRealtimeUpdates();
      console.log("Real-time updates set up");

      // Set up offline handling
      this.setupOfflineHandling();
      console.log("Offline handling set up");

      // Render initial view
      this.renderCurrentView();
      console.log("Initial view rendered");

      // Ensure drag overlay is hidden
      this.hideDragOverlay();

      this.isInitialized = true;

      // Hide loading spinner with a small delay to ensure everything is rendered
      setTimeout(() => {
        this.hideLoadingSpinner();
        console.log("Loading complete");

        // Show welcome notification
        setTimeout(() => {
          this.showNotification(
            "Welcome to TaskFlow!",
            "Your collaborative workspace is ready.",
            "success"
          );
        }, 500);
      }, 500);
    } catch (error) {
      console.error("Error initializing app:", error);
      this.handleInitializationError(error);
    }
  }

  // Handle initialization errors gracefully
  handleInitializationError(error) {
    console.error("Initialization failed:", error);

    // Force hide loading spinner
    this.hideLoadingSpinner();

    // Show error message
    this.showNotification(
      "Initialization Error",
      "Some features may not work properly. Please refresh the page.",
      "error"
    );

    // Try to render a basic view anyway
    try {
      this.renderBasicView();
    } catch (renderError) {
      console.error("Failed to render basic view:", renderError);
      this.showFallbackUI();
    }
  }

  // Show fallback UI if everything fails
  showFallbackUI() {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: var(--font-family-base);">
                    <h1 style="color: var(--color-error); margin-bottom: 16px;">TaskFlow Error</h1>
                    <p style="color: var(--color-text-secondary); margin-bottom: 24px;">The application encountered an error during initialization.</p>
                    <button onclick="location.reload()" class="btn btn--primary">Refresh Page</button>
                </div>
            `;
      app.classList.remove("hidden");
    }
  }

  // Render a basic view when there are errors
  renderBasicView() {
    console.log("Rendering basic view...");

    // Initialize minimal data if not already done
    if (!this.users.length) {
      this.initializeMinimalData();
    }

    this.renderCurrentView();
    this.renderSidebar();
  }

  // Initialize minimal data for fallback
  initializeMinimalData() {
    this.users = [
      {
        id: "user-1",
        name: "Deepanshu",
        email: "Deepanshu@company.com",
        avatar: "DC",
        role: "Designer",
        isOnline: true,
        color: "#1FB8CD",
      },
    ];

    this.columns = [
      { id: "col-todo", name: "To Do", order: 0, color: "#3b82f6" },
      { id: "col-done", name: "Done", order: 1, color: "#10b981" },
    ];

    this.tasks = [
      {
        id: "task-1",
        title: "Welcome Task",
        description: "Welcome to TaskFlow!",
        status: "todo",
        priority: "medium",
        assigneeId: "user-1",
        columnId: "col-todo",
        tags: ["welcome"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.activities = [];
    this.currentUser = this.users[0];
  }

  // Initialize data from localStorage or use sample data
  async initializeData() {
    console.log("Loading data...");

    // Load data from localStorage or use sample data
    this.users = this.loadFromStorage("taskflow-users") || [
      {
        id: "user-1",
        name: "Deepanshu",
        email: "Deepanshu@company.com",
        avatar: "DC",
        role: "Designer",
        isOnline: true,
        color: "#1FB8CD",
      },
      {
        id: "user-2",
        name: "Rajesh",
        email: "Rajesh@company.com",
        avatar: "RJ",
        role: "Developer",
        isOnline: true,
        color: "#FFC185",
      },
      {
        id: "user-3",
        name: "Ekta",
        email: "ekta@company.com",
        avatar: "EK",
        role: "Product Manager",
        isOnline: false,
        color: "#B4413C",
      },
    ];

    this.columns = this.loadFromStorage("taskflow-columns") || [
      { id: "col-backlog", name: "Backlog", order: 0, color: "#64748b" },
      { id: "col-todo", name: "To Do", order: 1, color: "#3b82f6" },
      {
        id: "col-in-progress",
        name: "In Progress",
        order: 2,
        color: "#f59e0b",
      },
      { id: "col-review", name: "Review", order: 3, color: "#8b5cf6" },
      { id: "col-done", name: "Done", order: 4, color: "#10b981" },
    ];

    this.tasks = this.loadFromStorage("taskflow-tasks") || [
      {
        id: "task-1",
        title: "Design Landing Page",
        description:
          "Create a modern, responsive landing page for the new product launch",
        status: "in-progress",
        priority: "high",
        assigneeId: "user-1",
        dueDate: "2025-08-15",
        createdAt: "2025-08-01T10:00:00Z",
        updatedAt: "2025-08-02T14:30:00Z",
        tags: ["design", "frontend"],
        columnId: "col-in-progress",
      },
      {
        id: "task-2",
        title: "API Integration",
        description: "Integrate payment gateway API with the checkout system",
        status: "todo",
        priority: "critical",
        assigneeId: "user-2",
        dueDate: "2025-08-10",
        createdAt: "2025-08-01T09:00:00Z",
        updatedAt: "2025-08-01T09:00:00Z",
        tags: ["backend", "api"],
        columnId: "col-todo",
      },
      {
        id: "task-3",
        title: "User Testing",
        description: "Conduct usability testing with 10 target users",
        status: "review",
        priority: "medium",
        assigneeId: "user-3",
        dueDate: "2025-08-20",
        createdAt: "2025-07-28T11:00:00Z",
        updatedAt: "2025-08-02T16:00:00Z",
        tags: ["testing", "ux"],
        columnId: "col-review",
      },
      {
        id: "task-4",
        title: "Database Optimization",
        description: "Optimize database queries for better performance",
        status: "backlog",
        priority: "low",
        assigneeId: "user-2",
        dueDate: "2025-08-25",
        createdAt: "2025-08-01T08:00:00Z",
        updatedAt: "2025-08-01T08:00:00Z",
        tags: ["backend", "performance"],
        columnId: "col-backlog",
      },
      {
        id: "task-5",
        title: "Mobile App Testing",
        description: "Complete testing of mobile application features",
        status: "done",
        priority: "medium",
        assigneeId: "user-3",
        dueDate: "2025-08-05",
        createdAt: "2025-07-25T10:00:00Z",
        updatedAt: "2025-08-01T16:00:00Z",
        tags: ["mobile", "testing"],
        columnId: "col-done",
      },
    ];

    this.activities = this.loadFromStorage("taskflow-activities") || [
      {
        id: "activity-1",
        type: "task_created",
        message: 'Sarah Chen created "Design Landing Page"',
        userId: "user-1",
        taskId: "task-1",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "activity-2",
        type: "task_moved",
        message: 'Mike Johnson moved "API Integration" to To Do',
        userId: "user-2",
        taskId: "task-2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "activity-3",
        type: "task_completed",
        message: 'Emma Davis completed "Mobile App Testing"',
        userId: "user-3",
        taskId: "task-5",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    this.currentUser = this.users[0]; // Default to first user

    // Save initial data
    this.saveToStorage("taskflow-users", this.users);
    this.saveToStorage("taskflow-columns", this.columns);
    this.saveToStorage("taskflow-tasks", this.tasks);
    this.saveToStorage("taskflow-activities", this.activities);

    console.log("Data loaded successfully");
  }

  // Set up all event listeners
  async setupEventListeners() {
    try {
      // Navigation
      const navBtns = document.querySelectorAll(".nav-btn");
      navBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const view = e.currentTarget.dataset.view;
          this.switchView(view);
        });
      });

      // Theme toggle
      const themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        themeToggle.addEventListener("click", () => {
          this.toggleTheme();
        });
      }

      // Task modal
      const addTaskBtn = document.getElementById("add-task-btn");
      if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
          this.openTaskModal();
        });
      }

      const closeModal = document.getElementById("close-modal");
      if (closeModal) {
        console.log("Close modal button found, adding event listeners");
        
        // Simple click handler
        closeModal.addEventListener("click", (e) => {
          console.log("Close modal button clicked (addEventListener)");
          e.preventDefault();
          e.stopPropagation();
          this.closeTaskModal();
        });
        
      } else {
        console.error("Close modal button not found!");
      }

      const cancelTask = document.getElementById("cancel-task");
      if (cancelTask) {
        cancelTask.addEventListener("click", () => {
          this.closeTaskModal();
        });
      }

      const modalBackdrop = document.querySelector(".modal-backdrop");
      if (modalBackdrop) {
        console.log("Modal backdrop found, adding event listener");
        modalBackdrop.addEventListener("click", (e) => {
          console.log("Modal backdrop clicked, target:", e.target);
          // Only close if clicking directly on the backdrop, not on modal content
          if (e.target === modalBackdrop) {
            console.log("Backdrop clicked directly, closing modal");
            this.closeTaskModal();
          } else {
            console.log("Backdrop clicked but target is not backdrop itself");
          }
        });
      } else {
        console.error("Modal backdrop not found!");
      }

      // Task form
      const taskForm = document.getElementById("task-form");
      if (taskForm) {
        taskForm.addEventListener("submit", (e) => {
          e.preventDefault();
          this.saveTask();
        });
      }

      // Filters
      const priorityFilter = document.getElementById("priority-filter");
      if (priorityFilter) {
        priorityFilter.addEventListener("change", (e) => {
          this.filters.priority = e.target.value;
          this.applyFilters();
        });
      }

      const assigneeFilter = document.getElementById("assignee-filter");
      if (assigneeFilter) {
        assigneeFilter.addEventListener("change", (e) => {
          this.filters.assignee = e.target.value;
          this.applyFilters();
        });
      }

      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.filters.search = e.target.value;
          this.debounceSearch();
        });
      }

      // Add column button
      const addColumnBtn = document.getElementById("add-column-btn");
      if (addColumnBtn) {
        addColumnBtn.addEventListener("click", () => {
          this.addColumn();
        });
      }

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        // Escape key to close modal
        if (e.key === "Escape") {
          this.closeTaskModal();
        }
        
        // Ctrl/Cmd + N to add new task
        if ((e.ctrlKey || e.metaKey) && e.key === "n") {
          e.preventDefault();
          this.openTaskModal();
        }
        
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          const searchInput = document.getElementById("search-input");
          if (searchInput) {
            searchInput.focus();
          }
        }
      });

      // Mobile sidebar toggle (for responsive design)
      this.setupMobileListeners();

      // Global event listener to handle stuck drag overlay
      document.addEventListener("click", (e) => {
        const dragOverlay = document.getElementById("drag-overlay");
        if (dragOverlay && !dragOverlay.classList.contains("hidden")) {
          // If user clicks anywhere and drag overlay is visible, hide it
          this.hideDragOverlay();
        }
      });

      // Emergency close button for drag overlay
      const emergencyCloseBtn = document.getElementById("emergency-close-overlay");
      if (emergencyCloseBtn) {
        emergencyCloseBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.hideDragOverlay();
        });
      }

      // Clean up resources when page unloads
      window.addEventListener("beforeunload", () => {
        this.cleanup();
      });

      console.log("Event listeners set up successfully");
    } catch (error) {
      console.error("Error setting up event listeners:", error);
      throw error;
    }
  }

  // Set up mobile-specific listeners
  setupMobileListeners() {
    if (window.innerWidth <= 768) {
      const searchBtn = document.getElementById("search-btn");
      if (searchBtn) {
        searchBtn.addEventListener("click", () => {
          const sidebar = document.querySelector(".sidebar");
          if (sidebar) {
            sidebar.classList.toggle("open");
          }
        });
      }
    }
  }

  // Set up real-time updates using localStorage events
  setupRealtimeUpdates() {
    this.storageListener = (e) => {
      if (e.key === "taskflow-tasks" || e.key === "taskflow-activities") {
        this.handleRealtimeUpdate(e);
      }
    };
    
    window.addEventListener("storage", this.storageListener);

    // Simulate real-time updates from other users
    this.realtimeInterval = setInterval(() => {
      if (this.isInitialized) {
        this.simulateRealtimeActivity();
      }
    }, 45000); // Every 45 seconds
  }

  // Clean up event listeners and intervals
  cleanup() {
    if (this.storageListener) {
      window.removeEventListener("storage", this.storageListener);
    }
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
    }
  }

  // Export data for backup
  exportData() {
    try {
      const exportData = {
        tasks: this.tasks,
        columns: this.columns,
        users: this.users,
        activities: this.activities,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
      this.showNotification("Export Successful", "Data has been exported successfully", "success");
    } catch (error) {
      console.error("Export failed:", error);
      this.showNotification("Export Failed", "Failed to export data", "error");
    }
  }

  // Import data from backup
  importData(file) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.tasks && Array.isArray(importData.tasks)) {
            this.tasks = importData.tasks;
            this.saveToStorage("taskflow-tasks", this.tasks);
          }
          
          if (importData.columns && Array.isArray(importData.columns)) {
            this.columns = importData.columns;
            this.saveToStorage("taskflow-columns", this.columns);
          }
          
          if (importData.users && Array.isArray(importData.users)) {
            this.users = importData.users;
            this.saveToStorage("taskflow-users", this.users);
          }
          
          this.renderCurrentView();
          this.showNotification("Import Successful", "Data has been imported successfully", "success");
        } catch (parseError) {
          console.error("Import parse error:", parseError);
          this.showNotification("Import Failed", "Invalid file format", "error");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Import failed:", error);
      this.showNotification("Import Failed", "Failed to import data", "error");
    }
  }

  // Handle real-time updates
  handleRealtimeUpdate(event) {
    if (!this.isInitialized) return;

    try {
      if (event.key === "taskflow-tasks") {
        this.tasks = JSON.parse(event.newValue || "[]");
        this.renderCurrentView();
        this.showNotification(
          "Real-time Update",
          "Tasks have been updated by a team member",
          "info"
        );
      }

      if (event.key === "taskflow-activities") {
        this.activities = JSON.parse(event.newValue || "[]");
        this.renderActivityFeed();
      }
    } catch (error) {
      console.error("Error handling real-time update:", error);
      this.showNotification("Update Error", "Failed to sync with other users", "warning");
    }
  }

  // Check if app is online
  isOnline() {
    return navigator.onLine;
  }

  // Handle online/offline status
  setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.showNotification("Back Online", "Connection restored", "success");
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.showNotification("Offline Mode", "Working offline - changes will sync when reconnected", "warning");
    });
  }

  // Sync data when back online
  syncData() {
    try {
      // Re-save current data to trigger storage events
      this.saveToStorage("taskflow-tasks", this.tasks);
      this.saveToStorage("taskflow-activities", this.activities);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  // Simulate real-time activity from other users
  simulateRealtimeActivity() {
    const activities = [
      'Emma Davis commented on "User Testing"',
      'Mike Johnson updated the due date for "API Integration"',
      "Sarah Chen added a new task to Backlog",
      "System: Daily standup meeting in 30 minutes",
    ];

    const randomActivity =
      activities[Math.floor(Math.random() * activities.length)];
    const activity = {
      id: "activity-" + Date.now(),
      type: "system",
      message: randomActivity,
      userId: "system",
      taskId: null,
      timestamp: new Date().toISOString(),
    };

    this.activities.unshift(activity);
    this.saveToStorage("taskflow-activities", this.activities);
    this.renderActivityFeed();
  }

  // Theme management
  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.setTheme(this.theme);
    localStorage.setItem("taskflow-theme", this.theme);
    this.showNotification(
      "Theme Changed",
      `Switched to ${this.theme} mode`,
      "success"
    );
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-color-scheme", theme);

    const lightIcon = document.querySelector(".theme-icon-light");
    const darkIcon = document.querySelector(".theme-icon-dark");

    if (lightIcon && darkIcon) {
      if (theme === "dark") {
        lightIcon.classList.add("hidden");
        darkIcon.classList.remove("hidden");
      } else {
        lightIcon.classList.remove("hidden");
        darkIcon.classList.add("hidden");
      }
    }
  }

  // View management
  switchView(view) {
    console.log(`Switching to ${view} view`);
    this.currentView = view;

    // Update navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    const activeBtn = document.querySelector(`[data-view="${view}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    // Update view containers
    document.querySelectorAll(".view-container").forEach((container) => {
      container.classList.remove("active");
    });
    const activeView = document.getElementById(`${view}-view`);
    if (activeView) {
      activeView.classList.add("active");
    }

    this.renderCurrentView();
    this.showNotification("View Changed", `Switched to ${view} view`, "info");
  }

  // Render current view
  renderCurrentView() {
    if (!this.isInitialized) {
      console.log("App not initialized yet, skipping render");
      return;
    }

    try {
      switch (this.currentView) {
        case "kanban":
          this.renderKanbanView();
          break;
        case "list":
          this.renderListView();
          break;
        case "calendar":
          this.renderCalendarView();
          break;
      }

      this.renderSidebar();
      
      // Ensure drag overlay is hidden after rendering
      this.hideDragOverlay();
    } catch (error) {
      console.error("Error rendering current view:", error);
      this.showNotification(
        "Render Error",
        "Failed to render view properly",
        "error"
      );
    }
  }

  // Render Kanban view
  renderKanbanView() {
    const kanbanBoard = document.getElementById("kanban-board");
    if (!kanbanBoard) {
      console.error("Kanban board element not found");
      return;
    }

    const filteredTasks = this.getFilteredTasks();

    kanbanBoard.innerHTML = this.columns
      .map((column) => {
        const columnTasks = filteredTasks.filter(
          (task) => task.columnId === column.id
        );

        return `
                <div class="kanban-column" data-column-id="${column.id}">
                    <div class="column-header">
                        <div class="column-title">
                            <div class="column-color" style="background-color: ${
                              column.color
                            }"></div>
                            <span>${column.name}</span>
                        </div>
                        <div class="column-actions">
                            <span class="column-count">${
                              columnTasks.length
                            }</span>
                            <button class="column-add-btn" onclick="app.addTaskToColumn('${
                              column.id
                            }')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="column-tasks" data-column-id="${column.id}">
                        ${columnTasks
                          .map((task) => this.renderTaskCard(task))
                          .join("")}
                    </div>
                </div>
            `;
      })
      .join("");

    // Set up drag and drop after rendering
    setTimeout(() => {
      this.setupDragAndDrop();
    }, 100);
  }

  // Render task card
  renderTaskCard(task) {
    const assignee = this.users.find((user) => user.id === task.assigneeId);
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const today = new Date();
    const isOverdue = dueDate && dueDate < today;
    const isDueSoon =
      dueDate && dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    return `
            <div class="task-card" draggable="true" data-task-id="${
              task.id
            }" onclick="app.openTaskModal('${task.id}')">
                <div class="task-header">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-priority priority-${task.priority}"></div>
                </div>
                ${
                  task.description
                    ? `<div class="task-description">${this.escapeHtml(
                        task.description
                      )}</div>`
                    : ""
                }
                ${
                  task.tags && task.tags.length
                    ? `
                    <div class="task-tags">
                        ${task.tags
                          .map(
                            (tag) =>
                              `<span class="task-tag">${this.escapeHtml(
                                tag
                              )}</span>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                <div class="task-footer">
                    ${
                      assignee
                        ? `
                        <div class="task-assignee" style="background-color: ${assignee.color}" title="${assignee.name}">
                            ${assignee.avatar}
                        </div>
                    `
                        : "<div></div>"
                    }
                    ${
                      dueDate
                        ? `
                        <div class="task-due-date ${
                          isOverdue ? "overdue" : isDueSoon ? "due-soon" : ""
                        }" title="Due date">
                            ${this.formatDate(dueDate)}
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  // Set up drag and drop functionality
  setupDragAndDrop() {
    const taskCards = document.querySelectorAll(".task-card");
    const columns = document.querySelectorAll(".column-tasks");

    // Ensure drag overlay is hidden initially
    this.hideDragOverlay();

    // Task card drag events
    taskCards.forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        this.draggedTask = this.tasks.find((task) => task.id === taskId);
        e.currentTarget.classList.add("dragging");
        e.dataTransfer.setData("text/plain", taskId);

        this.showDragOverlay();
      });

      card.addEventListener("dragend", (e) => {
        e.currentTarget.classList.remove("dragging");
        this.draggedTask = null;
        this.hideDragOverlay();

        // Remove drag-over classes from all columns
        document.querySelectorAll(".kanban-column").forEach((col) => {
          col.classList.remove("drag-over");
        });
      });
    });

    // Column drop events
    columns.forEach((column) => {
      column.addEventListener("dragover", (e) => {
        e.preventDefault();
        column.parentElement.classList.add("drag-over");
      });

      column.addEventListener("dragleave", (e) => {
        if (!column.contains(e.relatedTarget)) {
          column.parentElement.classList.remove("drag-over");
        }
      });

      column.addEventListener("drop", (e) => {
        e.preventDefault();
        column.parentElement.classList.remove("drag-over");
        this.hideDragOverlay();

        const columnId = column.dataset.columnId;
        if (this.draggedTask && this.draggedTask.columnId !== columnId) {
          this.moveTask(this.draggedTask.id, columnId);
        }
      });
    });

    // Add global event listeners to ensure overlay is hidden
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideDragOverlay();
      }
    });

    // Hide overlay on window blur/focus
    window.addEventListener("blur", () => this.hideDragOverlay());
    window.addEventListener("focus", () => this.hideDragOverlay());
  }

  // Helper methods for drag overlay management
  showDragOverlay() {
    const dragOverlay = document.getElementById("drag-overlay");
    if (dragOverlay) {
      dragOverlay.classList.remove("hidden");
      dragOverlay.style.display = "flex";
    }
  }

  hideDragOverlay() {
    const dragOverlay = document.getElementById("drag-overlay");
    if (dragOverlay) {
      dragOverlay.classList.add("hidden");
      dragOverlay.style.display = "none";
      // Force a repaint
      dragOverlay.offsetHeight;
    }
  }

  // Move task to different column
  moveTask(taskId, newColumnId) {
    const task = this.tasks.find((t) => t.id === taskId);
    const newColumn = this.columns.find((c) => c.id === newColumnId);

    if (task && newColumn) {
      const oldColumnName = this.columns.find(
        (c) => c.id === task.columnId
      )?.name;
      task.columnId = newColumnId;
      task.status = newColumnId.replace("col-", "");
      task.updatedAt = new Date().toISOString();

      this.saveToStorage("taskflow-tasks", this.tasks);

      // Add activity
      this.addActivity(
        "task_moved",
        `${this.currentUser.name} moved "${task.title}" from ${oldColumnName} to ${newColumn.name}`,
        taskId
      );

      this.renderCurrentView();
      this.showNotification(
        "Task Moved",
        `"${task.title}" moved to ${newColumn.name}`,
        "success"
      );
    }
  }

  // Render List view
  renderListView() {
    const taskList = document.getElementById("task-list");
    if (!taskList) return;

    const filteredTasks = this.getFilteredTasks();

    taskList.innerHTML = filteredTasks
      .map((task) => {
        const assignee = this.users.find((user) => user.id === task.assigneeId);
        const column = this.columns.find((col) => col.id === task.columnId);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;

        return `
                <div class="task-list-item" onclick="app.openTaskModal('${
                  task.id
                }')">
                    <div class="task-list-checkbox ${
                      task.status === "done" ? "completed" : ""
                    }" onclick="event.stopPropagation(); app.toggleTaskCompletion('${
          task.id
        }')">
                        ${task.status === "done" ? "✓" : ""}
                    </div>
                    <div class="task-list-content">
                        <div class="task-list-title">${this.escapeHtml(
                          task.title
                        )}</div>
                        <div class="task-list-meta">
                            <span class="status--${
                              task.priority
                            }">${task.priority.toUpperCase()}</span>
                            ${
                              assignee
                                ? `<span>Assigned to ${assignee.name}</span>`
                                : "<span>Unassigned</span>"
                            }
                            ${column ? `<span>${column.name}</span>` : ""}
                            ${
                              dueDate
                                ? `<span>Due ${this.formatDate(dueDate)}</span>`
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // Toggle task completion
  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      const newStatus = task.status === "done" ? "todo" : "done";
      const newColumnId = newStatus === "done" ? "col-done" : "col-todo";

      task.status = newStatus;
      task.columnId = newColumnId;
      task.updatedAt = new Date().toISOString();

      this.saveToStorage("taskflow-tasks", this.tasks);
      this.addActivity(
        "task_updated",
        `${this.currentUser.name} marked "${task.title}" as ${newStatus}`,
        taskId
      );
      this.renderCurrentView();
      this.showNotification(
        "Task Updated",
        `"${task.title}" marked as ${newStatus}`,
        "success"
      );
    }
  }

  // Render Calendar view
  renderCalendarView() {
    const calendarContainer = document.querySelector(".calendar-grid");
    if (!calendarContainer) return;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayTasks = this.tasks.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === current.toDateString();
      });

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === today.getMonth(),
        isToday: current.toDateString() === today.toDateString(),
        tasks: dayTasks,
      });

      current.setDate(current.getDate() + 1);
    }

    calendarContainer.innerHTML = days
      .map(
        (day) => `
            <div class="calendar-day ${
              day.isCurrentMonth ? "" : "other-month"
            } ${day.isToday ? "today" : ""}">
                <div class="calendar-day-number">${day.date.getDate()}</div>
                ${day.tasks
                  .map(
                    (task) => `
                    <div class="calendar-task" onclick="app.openTaskModal('${
                      task.id
                    }')" title="${this.escapeHtml(task.title)}">
                        ${this.escapeHtml(task.title)}
                    </div>
                `
                  )
                  .join("")}
            </div>
        `
      )
      .join("");
  }

  // Render sidebar
  renderSidebar() {
    this.renderTeamList();
    this.renderActivityFeed();
    this.renderFilters();
  }

  // Render team list
  renderTeamList() {
    const teamList = document.getElementById("team-list");
    if (!teamList) return;

    teamList.innerHTML = this.users
      .map(
        (user) => `
            <div class="team-member">
                <div class="team-member-avatar" style="background-color: ${
                  user.color
                }">
                    ${user.avatar}
                    ${
                      user.isOnline
                        ? '<div class="online-indicator"></div>'
                        : ""
                    }
                </div>
                <div class="team-member-info">
                    <div class="team-member-name">${this.escapeHtml(
                      user.name
                    )}</div>
                    <div class="team-member-role">${this.escapeHtml(
                      user.role
                    )}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Render activity feed
  renderActivityFeed() {
    const activityFeed = document.getElementById("activity-feed");
    if (!activityFeed) return;

    const recentActivities = this.activities.slice(0, 5);

    activityFeed.innerHTML = recentActivities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-text">${this.escapeHtml(
                  activity.message
                )}</div>
                <div class="activity-time">${this.getRelativeTime(
                  activity.timestamp
                )}</div>
            </div>
        `
      )
      .join("");
  }

  // Render filters
  renderFilters() {
    const assigneeFilter = document.getElementById("assignee-filter");
    const taskColumnSelect = document.getElementById("task-column");
    const taskAssigneeSelect = document.getElementById("task-assignee");

    // Update assignee filter
    if (assigneeFilter) {
      assigneeFilter.innerHTML =
        '<option value="">All Assignees</option>' +
        this.users
          .map(
            (user) =>
              `<option value="${user.id}">${this.escapeHtml(
                user.name
              )}</option>`
          )
          .join("");
    }

    // Update modal selects
    if (taskColumnSelect) {
      taskColumnSelect.innerHTML = this.columns
        .map(
          (column) =>
            `<option value="${column.id}">${this.escapeHtml(
              column.name
            )}</option>`
        )
        .join("");
    }

    if (taskAssigneeSelect) {
      taskAssigneeSelect.innerHTML =
        '<option value="">Unassigned</option>' +
        this.users
          .map(
            (user) =>
              `<option value="${user.id}">${this.escapeHtml(
                user.name
              )}</option>`
          )
          .join("");
    }
  }

  // Task modal management
  openTaskModal(taskId = null) {
    console.log("openTaskModal called");
    const modal = document.getElementById("task-modal");
    const modalTitle = document.getElementById("modal-title");
    const form = document.getElementById("task-form");
    const backdrop = document.querySelector(".modal-backdrop");

    if (!modal || !modalTitle || !form) {
      console.error("Modal elements not found:", { modal: !!modal, modalTitle: !!modalTitle, form: !!form });
      return;
    }

    if (taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        modalTitle.textContent = "Edit Task";
        this.populateTaskForm(task);
        form.dataset.taskId = taskId;
      }
    } else {
      modalTitle.textContent = "Add New Task";
      form.reset();
      delete form.dataset.taskId;
      const taskColumn = document.getElementById("task-column");
      const taskPriority = document.getElementById("task-priority");
      if (taskColumn) taskColumn.value = "col-backlog";
      if (taskPriority) taskPriority.value = "medium";
    }
    
    // Show the modal with a more robust approach
    modal.style.display = "flex";
    modal.classList.remove('hidden');
    
    // Ensure backdrop is visible
    if (backdrop) {
      backdrop.style.display = "block";
    }
    
    // Ensure close button is accessible
    const closeModal = document.getElementById("close-modal");
    if (!closeModal) {
      console.error("Close button not found when modal opens!");
    }
  }

  closeTaskModal() {
    console.log("closeTaskModal method called");
    const modal = document.getElementById("task-modal");
    const backdrop = document.querySelector(".modal-backdrop");
    
    if (modal) {
      console.log("Modal found, hiding it");
      
      // Hide the modal with a more robust approach
      modal.style.display = "none";
      modal.classList.add("hidden");
      
      // Also ensure backdrop is hidden
      if (backdrop) {
        backdrop.style.display = "none";
      }
      
      // Reset form and clear errors
      const form = document.getElementById("task-form");
      if (form) {
        form.reset();
        form.removeAttribute("data-task-id");
        this.clearFormErrors();
      }
      
      // Force a repaint to ensure the modal is visually hidden
      modal.offsetHeight;
      
      console.log("Modal hidden successfully");
    } else {
      console.error("Modal not found!");
    }
  }

  // Populate task form with existing task data
  populateTaskForm(task) {
    const fields = {
      "task-title": task.title || "",
      "task-description": task.description || "",
      "task-priority": task.priority || "medium",
      "task-assignee": task.assigneeId || "",
      "task-due-date": task.dueDate || "",
      "task-column": task.columnId || "col-backlog",
      "task-tags": task.tags ? task.tags.join(", ") : "",
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      }
    });
  }

  // Save task (create or update)
  // Validate task form data
  validateTaskForm(taskData) {
    const errors = {};

    // Title validation
    if (!taskData.title) {
      errors.title = "Task title is required";
    } else if (taskData.title.length > 100) {
      errors.title = "Task title must be 100 characters or less";
    }

    // Description validation
    if (taskData.description && taskData.description.length > 500) {
      errors.description = "Description must be 500 characters or less";
    }

    // Due date validation
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    // Tags validation
    if (taskData.tags.length > 10) {
      errors.tags = "Maximum 10 tags allowed";
    }

    return errors;
  }

  // Show form validation errors
  showFormErrors(errors) {
    // Clear previous errors
    this.clearFormErrors();

    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.hidden = false;
      }
    });
  }

  // Clear form validation errors
  clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.hidden = true;
    });
  }

  saveTask() {
    const form = document.getElementById("task-form");
    if (!form) return;

    const taskId = form.dataset.taskId;
    const isEditing = !!taskId;

    const taskData = {
      title: (document.getElementById("task-title")?.value || "").trim(),
      description: (
        document.getElementById("task-description")?.value || ""
      ).trim(),
      priority: document.getElementById("task-priority")?.value || "medium",
      assigneeId: document.getElementById("task-assignee")?.value || "",
      dueDate: document.getElementById("task-due-date")?.value || "",
      columnId: document.getElementById("task-column")?.value || "col-backlog",
      tags: (document.getElementById("task-tags")?.value || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      updatedAt: new Date().toISOString(),
    };

    // Validate form data
    const errors = this.validateTaskForm(taskData);
    if (Object.keys(errors).length > 0) {
      this.showFormErrors(errors);
      this.showNotification("Validation Error", "Please fix the errors in the form", "error");
      return;
    }

    // Clear any previous errors
    this.clearFormErrors();

    try {
      if (isEditing) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
          Object.assign(task, taskData);
          this.addActivity(
            "task_updated",
            `${this.currentUser.name} updated "${task.title}"`,
            taskId
          );
          this.showNotification(
            "Task Updated",
            `"${task.title}" has been updated`,
            "success"
          );
        }
      } else {
        const newTask = {
          id: "task-" + Date.now(),
          ...taskData,
          status: taskData.columnId.replace("col-", ""),
          createdAt: new Date().toISOString(),
        };
        this.tasks.push(newTask);
        this.addActivity(
          "task_created",
          `${this.currentUser.name} created "${newTask.title}"`,
          newTask.id
        );
        this.showNotification(
          "Task Created",
          `"${newTask.title}" has been created`,
          "success"
        );
      }

      this.saveToStorage("taskflow-tasks", this.tasks);
      this.renderCurrentView();
      this.closeTaskModal();
    } catch (error) {
      console.error("Error saving task:", error);
      this.showNotification("Error", "Failed to save task. Please try again.", "error");
    }
  }

  // Add task to specific column
  addTaskToColumn(columnId) {
    this.openTaskModal();
    setTimeout(() => {
      const taskColumn = document.getElementById("task-column");
      if (taskColumn) {
        taskColumn.value = columnId;
      }
    }, 100);
  }

  // Add new column
  addColumn() {
    const name = prompt("Enter column name:");
    if (name && name.trim()) {
      const newColumn = {
        id: "col-" + Date.now(),
        name: name.trim(),
        order: this.columns.length,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      };

      this.columns.push(newColumn);
      this.saveToStorage("taskflow-columns", this.columns);
      this.renderCurrentView();
      this.showNotification(
        "Column Added",
        `"${name}" column has been added`,
        "success"
      );
    }
  }

  // Filter and search functionality
  getFilteredTasks() {
    return this.tasks.filter((task) => {
      const matchesPriority =
        !this.filters.priority || task.priority === this.filters.priority;
      const matchesAssignee =
        !this.filters.assignee || task.assigneeId === this.filters.assignee;
      const matchesSearch =
        !this.filters.search ||
        task.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        (task.description &&
          task.description
            .toLowerCase()
            .includes(this.filters.search.toLowerCase()));

      return matchesPriority && matchesAssignee && matchesSearch;
    });
  }

  applyFilters() {
    this.renderCurrentView();
  }

  // Debounced search
  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  // Enhanced search with highlighting
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Get search suggestions
  getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    const suggestions = [];
    const searchTerm = query.toLowerCase();
    
    // Search in task titles
    this.tasks.forEach(task => {
      if (task.title.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          type: 'task',
          title: task.title,
          id: task.id,
          priority: task.priority
        });
      }
    });
    
    // Search in task descriptions
    this.tasks.forEach(task => {
      if (task.description && task.description.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          type: 'task',
          title: task.title,
          id: task.id,
          priority: task.priority
        });
      }
    });
    
    // Remove duplicates
    return suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    ).slice(0, 5); // Limit to 5 suggestions
  }

  // Add activity to feed
  addActivity(type, message, taskId = null) {
    const activity = {
      id: "activity-" + Date.now(),
      type,
      message,
      userId: this.currentUser.id,
      taskId,
      timestamp: new Date().toISOString(),
    };

    this.activities.unshift(activity);
    this.saveToStorage("taskflow-activities", this.activities);
    this.renderActivityFeed();
  }

  // Show notification
  showNotification(title, message, type = "info") {
    const container = document.getElementById("notifications-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="notification-text">
                    <div class="notification-title">${this.escapeHtml(
                      title
                    )}</div>
                    <div class="notification-message">${this.escapeHtml(
                      message
                    )}</div>
                </div>
            </div>
        `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      success:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
      error:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };
    return icons[type] || icons.info;
  }

  // Loading spinner
  showLoadingSpinner() {
    const spinner = document.getElementById("loading-spinner");
    const app = document.getElementById("app");
    if (spinner) {
      spinner.style.display = "flex";
      spinner.classList.remove("hidden");
    }
    if (app) {
      app.style.display = "none";
      app.classList.add("hidden");
    }
  }

  hideLoadingSpinner() {
    const spinner = document.getElementById("loading-spinner");
    const app = document.getElementById("app");
    if (spinner) {
      spinner.style.display = "none";
      spinner.classList.add("hidden");
    }
    if (app) {
      app.style.display = "flex";
      app.classList.remove("hidden");
    }
  }

  // Utility functions
  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading from storage:", error);
      return null;
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(date) {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7)
      return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString();
  }

  getRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return time.toLocaleDateString();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing TaskFlow...");

  try {
    window.app = new TaskFlowApp();
    app.init(); // Initialize the app
  } catch (error) {
    console.error("Failed to initialize TaskFlow app:", error);

    // Show fallback error message
    const loadingSpinner = document.getElementById("loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.innerHTML = `
                <div style="text-align: center; font-family: var(--font-family-base);">
                    <h1 style="color: var(--color-error); margin-bottom: 16px;">TaskFlow Failed to Load</h1>
                    <p style="color: var(--color-text-secondary); margin-bottom: 24px;">Please refresh the page to try again.</p>
                    <button onclick="location.reload()" class="btn btn--primary">Refresh Page</button>
                </div>
            `;
    }
  }
});

// Handle window resize for responsive design
window.addEventListener("resize", () => {
  if (window.app && window.app.isInitialized) {
    window.app.setupMobileListeners();
  }
});




