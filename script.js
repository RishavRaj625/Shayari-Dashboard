// Global Variables
let shayaris = [];
let currentFilter = "all";
let editingId = null;
let contextMenuTarget = null;
let shayariManager = null; // Declare globally

// Storage Configuration
const STORAGE_KEY = 'shayari_collection';
const THEME_KEY = 'shayari_theme';
const FILTER_KEY = 'shayari_filter';

// Enhanced Canvas Cursor Effects with Connected Particles
class CursorEffect {
  constructor() {
    this.canvas = document.getElementById("cursorCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.particleCount = 50;

    this.init();
  }

  init() {
    this.resize();
    this.bindEvents();
    this.createInitialParticles();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.addCursorParticle();
    });
  }

  createInitialParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.particles.push(new Particle(x, y));
    }
  }

  addCursorParticle() {
    // Add particle at cursor position
    this.particles.push(new Particle(this.mouse.x, this.mouse.y, true));
    
    // Limit particles
    if (this.particles.length > this.particleCount + 20) {
      this.particles.shift();
    }
  }

  connectParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = 1 - (distance / 120);
          this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity * 0.3})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles.forEach((particle, index) => {
      particle.update(this.canvas);
      particle.draw(this.ctx);

      // Remove faded particles
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    });

    // Connect particles with lines
    this.connectParticles();

    requestAnimationFrame(() => this.animate());
  }
}

// Particle class for the enhanced cursor effect
class Particle {
  constructor(x, y, isCursorParticle = false) {
    this.x = x;
    this.y = y;
    this.size = isCursorParticle ? Math.random() * 4 + 2 : Math.random() * 3 + 1;
    this.speedX = isCursorParticle ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 1;
    this.speedY = isCursorParticle ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 1;
    this.life = isCursorParticle ? 1 : 0.8;
    this.decay = isCursorParticle ? 0.015 : 0.005;
    this.isCursorParticle = isCursorParticle;
    this.originalLife = this.life;
  }

  update(canvas) {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.isCursorParticle) {
      // Cursor particles fade away
      this.life -= this.decay;
    } else {
      // Ambient particles wrap around screen
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
  }

  draw(ctx) {
    ctx.save();
    
    if (this.isCursorParticle) {
      // Cursor particles with gradient effect
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `rgba(102, 126, 234, ${this.life})`);
      gradient.addColorStop(1, `rgba(118, 75, 162, ${this.life * 0.5})`);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = this.life;
    } else {
      // Ambient particles with cyan color
      ctx.fillStyle = `rgba(0, 255, 255, ${this.life})`;
      ctx.globalAlpha = this.life;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

// Enhanced Local Storage Utility with better error handling
class StorageManager {
  static isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  static saveData(key, data) {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available. Data will not persist.');
      return false;
    }
    
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        // Handle storage quota exceeded
        this.handleStorageQuotaExceeded();
      }
      return false;
    }
  }

  static loadData(key, defaultValue = null) {
    if (!this.isLocalStorageAvailable()) {
      return defaultValue;
    }
    
    try {
      const data = localStorage.getItem(key);
      if (data === null) {
        return defaultValue;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  }

  static removeData(key) {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  static handleStorageQuotaExceeded() {
    console.warn('Storage quota exceeded. Attempting to clean up old data.');
    // Could implement cleanup logic here
    if (shayariManager) {
      shayariManager.showNotification('Storage full! Please export your data to free up space.', 'error');
    }
  }

  static getStorageSize() {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }
    
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  static exportData() {
    const shayaris = StorageManager.loadData(STORAGE_KEY, []);
    const theme = StorageManager.loadData(THEME_KEY, 'light');
    
    const exportData = {
      shayaris,
      theme,
      exportDate: new Date().toISOString(),
      version: '1.0',
      storageSize: this.getStorageSize()
    };

    try {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `shayari-collection-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(link.href);
      
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  }

  static importData(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate import data structure
          if (!importData.shayaris || !Array.isArray(importData.shayaris)) {
            reject(new Error('Invalid file format: missing or invalid shayaris array'));
            return;
          }

          // Validate each shayari object
          const validShayaris = importData.shayaris.filter(shayari => {
            return shayari && 
                   typeof shayari.title === 'string' && 
                   typeof shayari.content === 'string' && 
                   typeof shayari.category === 'string';
          });

          if (validShayaris.length === 0) {
            reject(new Error('No valid shayaris found in the file'));
            return;
          }

          // Get current data
          const currentShayaris = StorageManager.loadData(STORAGE_KEY, []);
          
          // Merge data - add imported shayaris with new IDs
          const mergedShayaris = [...currentShayaris];
          let importedCount = 0;

          validShayaris.forEach(shayari => {
            // Check for duplicates based on content
            const isDuplicate = currentShayaris.some(existing => 
              existing.content.trim() === shayari.content.trim()
            );

            if (!isDuplicate) {
              // Add with new ID and current timestamp
              const newShayari = {
                ...shayari,
                id: Date.now() + Math.random(), // Ensure unique ID
                imported: true,
                importDate: new Date().toISOString(),
                date: new Date().toLocaleDateString("hi-IN")
              };
              mergedShayaris.unshift(newShayari);
              importedCount++;
            }
          });
          
          // Save merged data
          const saved = StorageManager.saveData(STORAGE_KEY, mergedShayaris);
          if (!saved) {
            reject(new Error('Failed to save imported data'));
            return;
          }
          
          // Save theme if provided
          if (importData.theme) {
            StorageManager.saveData(THEME_KEY, importData.theme);
          }
          
          resolve({
            imported: importedCount,
            total: mergedShayaris.length,
            duplicatesSkipped: validShayaris.length - importedCount
          });
          
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };

      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  static clearAllData() {
    try {
      this.removeData(STORAGE_KEY);
      this.removeData(FILTER_KEY);
      // Keep theme data
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

// Theme Management with Local Storage
class ThemeManager {
  constructor() {
    this.theme = StorageManager.loadData(THEME_KEY, "light");
    this.init();
  }

  init() {
    this.applyTheme();
    this.bindEvents();
  }

  bindEvents() {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        this.toggle();
      });
    }
  }

  toggle() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.applyTheme();
    this.saveTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.theme);
    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) {
      themeIcon.textContent = this.theme === "light" ? "🌙" : "☀️";
    }
    
    // Update meta theme-color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = this.theme === 'light' ? '#ffffff' : '#1a1a1a';
  }

  saveTheme() {
    const saved = StorageManager.saveData(THEME_KEY, this.theme);
    if (!saved && shayariManager) {
      shayariManager.showNotification('Failed to save theme preference', 'error');
    }
  }
}

// Enhanced Shayari Management with Local Storage
class ShayariManager {
  constructor() {
    this.loadShayaris();
    this.loadFilter();
    this.bindEvents();
    this.updateStats();
    this.renderShayaris();
    this.showStorageInfo();
  }

  bindEvents() {
    // Add Shayari
    const addBtn = document.getElementById("addShayariBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.openModal();
      });
    }

    // Form submission
    const form = document.getElementById("shayariForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveShayari();
      });
    }

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });

    // Search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchShayaris(e.target.value);
      });
    }

    // Export/Import buttons
    this.bindDataManagementEvents();

    // Context menu
    document.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".shayari-card")) {
        e.preventDefault();
        this.showContextMenu(e, e.target.closest(".shayari-card"));
      }
    });

    // Touch and hold for mobile context menu
    let pressTimer;
    document.addEventListener("touchstart", (e) => {
      if (e.target.closest(".shayari-card")) {
        pressTimer = setTimeout(() => {
          const card = e.target.closest(".shayari-card");
          const id = parseInt(card.dataset.id);
          this.showMobileContextMenu(id);
        }, 800);
      }
    });

    document.addEventListener("touchend", () => {
      clearTimeout(pressTimer);
    });

    document.addEventListener("touchmove", () => {
      clearTimeout(pressTimer);
    });

    // Hide context menu
    document.addEventListener("click", () => {
      this.hideContextMenu();
    });

    // Modal overlay click
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.closeModal();
        }
      });
    }

    // Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
        this.hideContextMenu();
      }
    });

    // Context menu button events
    this.bindContextMenuEvents();
  }

  bindDataManagementEvents() {
    // Export data button
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const success = StorageManager.exportData();
        if (success) {
          this.showNotification("Data exported successfully!");
        } else {
          this.showNotification("Failed to export data!", 'error');
        }
      });
    }

    // Import data button
    const importBtn = document.getElementById("importBtn");
    const importInput = document.getElementById("importInput");
    
    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => {
        importInput.click();
      });

      importInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const result = await StorageManager.importData(file);
            this.loadShayaris();
            this.updateStats();
            this.renderShayaris();
            
            let message = `Successfully imported ${result.imported} shayaris!`;
            if (result.duplicatesSkipped > 0) {
              message += ` (${result.duplicatesSkipped} duplicates skipped)`;
            }
            
            this.showNotification(message);
          } catch (error) {
            console.error('Import error:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error');
          }
        }
        e.target.value = ''; // Reset input
      });
    }

    // Clear all data button
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.showConfirmDialog(
          "Are you sure you want to delete all shayaris? This action cannot be undone.",
          () => {
            this.clearAllData();
          }
        );
      });
    }
  }

  bindContextMenuEvents() {
    // Add event listeners for context menu buttons
    const editBtn = document.querySelector('[onclick="editShayari()"]');
    const duplicateBtn = document.querySelector('[onclick="duplicateShayari()"]');
    const deleteBtn = document.querySelector('[onclick="deleteShayari()"]');

    if (editBtn) {
      editBtn.onclick = (e) => {
        e.preventDefault();
        this.editShayari();
      };
    }

    if (duplicateBtn) {
      duplicateBtn.onclick = (e) => {
        e.preventDefault();
        this.duplicateShayariAction();
      };
    }

    if (deleteBtn) {
      deleteBtn.onclick = (e) => {
        e.preventDefault();
        this.deleteShayariAction();
      };
    }
  }

  loadShayaris() {
    // Load from localStorage or use default data
    const savedShayaris = StorageManager.loadData(STORAGE_KEY, null);
    
    if (savedShayaris && savedShayaris.length > 0) {
      shayaris = savedShayaris;
    } else {
      // Default shayaris for first time users
      shayaris = [
        {
          id: Date.now() + 1,
          title: "Heart's Voice",
          content:
            "Love knows no victory or defeat,\nOnly the depth of emotions so sweet.\nWho loves from the heart true,\nHas loyalty in every breath they breathe through.",
          category: "love",
          author: "Unknown",
          date: new Date().toLocaleDateString("en-US"),
          created: new Date().toISOString()
        },
        {
          id: Date.now() + 2,
          title: "Ray of Hope",
          content:
            "Learn to keep courage even in defeat,\nLearn to bring joy back into life's beat.\nNo matter how dark the night may be,\nLearn to wait for the dawn you'll see.",
          category: "motivational",
          author: "",
          date: new Date().toLocaleDateString("en-US"),
          created: new Date().toISOString()
        },
      ];
      this.saveToStorage();
    }
  }

  loadFilter() {
    currentFilter = StorageManager.loadData(FILTER_KEY, "all");
    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    const activeBtn = document.querySelector(`[data-filter="${currentFilter}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  saveToStorage() {
    const success = StorageManager.saveData(STORAGE_KEY, shayaris);
    if (!success) {
      this.showNotification("Failed to save data to storage!", 'error');
      return false;
    }
    return true;
  }

  saveFilter() {
    StorageManager.saveData(FILTER_KEY, currentFilter);
  }

  clearAllData() {
    const success = StorageManager.clearAllData();
    if (success) {
      shayaris = [];
      this.updateStats();
      this.renderShayaris();
      this.showNotification("All shayaris have been deleted!");
    } else {
      this.showNotification("Failed to clear data!", 'error');
    }
  }

  showStorageInfo() {
    if (StorageManager.isLocalStorageAvailable()) {
      const storageSize = StorageManager.getStorageSize();
      const sizeInKB = (storageSize / 1024).toFixed(2);
      console.log(`Storage used: ${sizeInKB} KB`);
    } else {
      console.warn('localStorage is not available. Data will not persist between sessions.');
      this.showNotification('Warning: Data will not be saved between sessions!', 'error');
    }
  }

  openModal(shayari = null) {
    const modal = document.getElementById("modalOverlay");
    const form = document.getElementById("shayariForm");
    const title = document.getElementById("modalTitle");

    if (!modal || !form || !title) return;

    if (shayari) {
      // Edit mode
      editingId = shayari.id;
      title.textContent = "Edit Shayari";

      const titleInput = document.getElementById("shayariTitle");
      const contentInput = document.getElementById("shayariContent");
      const categoryInput = document.getElementById("shayariCategory");
      const authorInput = document.getElementById("shayariAuthor");

      if (titleInput) titleInput.value = shayari.title;
      if (contentInput) contentInput.value = shayari.content;
      if (categoryInput) categoryInput.value = shayari.category;
      if (authorInput) authorInput.value = shayari.author || "";
    } else {
      // Add mode
      editingId = null;
      title.textContent = "Add New Shayari";
      form.reset();
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    const modal = document.getElementById("modalOverlay");
    if (modal) {
      modal.classList.remove("show");
    }
    document.body.style.overflow = "";
    editingId = null;

    // Reset form
    const form = document.getElementById("shayariForm");
    if (form) {
      form.reset();
    }
  }

  saveShayari() {
    const titleInput = document.getElementById("shayariTitle");
    const contentInput = document.getElementById("shayariContent");
    const categoryInput = document.getElementById("shayariCategory");
    const authorInput = document.getElementById("shayariAuthor");

    if (!titleInput || !contentInput || !categoryInput) {
      this.showNotification("Please fill in all required fields.", 'error');
      return;
    }

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categoryInput.value;
    const author = authorInput ? authorInput.value.trim() : "";

    if (!title || !content || !category) {
      this.showNotification("Please fill in all required fields.", 'error');
      return;
    }

    const now = new Date();
    const shayariData = {
      title,
      content,
      category,
      author,
      date: now.toLocaleDateString("en-US"),
      created: now.toISOString(),
      modified: now.toISOString()
    };

    if (editingId) {
      // Update existing shayari
      const index = shayaris.findIndex((s) => s.id === editingId);
      if (index !== -1) {
        shayaris[index] = { 
          ...shayaris[index], 
          ...shayariData,
          id: editingId // Keep original ID
        };
      }
    } else {
      // Add new shayari
      shayariData.id = Date.now() + Math.random(); // Ensure unique ID
      shayaris.unshift(shayariData);
    }

    const saved = this.saveToStorage();
    if (saved) {
      this.updateStats();
      this.renderShayaris();
      this.closeModal();

      // Show success message
      this.showNotification(
        editingId ? "Shayari updated successfully!" : "New shayari added successfully!"
      );
    }
  }

  deleteShayari(id) {
    this.showConfirmDialog(
      "Are you sure you want to delete this shayari?",
      () => {
        shayaris = shayaris.filter((s) => s.id !== id);
        const saved = this.saveToStorage();
        if (saved) {
          this.updateStats();
          this.renderShayaris();
          this.showNotification("Shayari deleted successfully!");
        }
      }
    );
  }

  duplicateShayari(id) {
    const shayari = shayaris.find((s) => s.id === id);
    if (shayari) {
      const duplicate = {
        ...shayari,
        id: Date.now() + Math.random(),
        title: shayari.title + " (Copy)",
        date: new Date().toLocaleDateString("en-US"),
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
      shayaris.unshift(duplicate);
      const saved = this.saveToStorage();
      if (saved) {
        this.updateStats();
        this.renderShayaris();
        this.showNotification("Shayari duplicated successfully!");
      }
    }
  }

  // Context menu action methods
  editShayari() {
    if (contextMenuTarget) {
      const id = parseInt(contextMenuTarget.dataset.id);
      const shayari = shayaris.find((s) => s.id === id);
      if (shayari) {
        this.openModal(shayari);
      }
    }
    this.hideContextMenu();
  }

  duplicateShayariAction() {
    if (contextMenuTarget) {
      const id = parseInt(contextMenuTarget.dataset.id);
      this.duplicateShayari(id);
    }
    this.hideContextMenu();
  }

  deleteShayariAction() {
    if (contextMenuTarget) {
      const id = parseInt(contextMenuTarget.dataset.id);
      this.deleteShayari(id);
    }
    this.hideContextMenu();
  }

  setFilter(filter) {
    currentFilter = filter;
    this.saveFilter();

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    this.renderShayaris();
  }

  searchShayaris(query) {
    this.renderShayaris(query);
  }

  renderShayaris(searchQuery = "") {
    const grid = document.getElementById("shayariGrid");
    const emptyState = document.getElementById("emptyState");

    if (!grid) return;

    let filteredShayaris = shayaris;

    // Apply category filter
    if (currentFilter !== "all") {
      filteredShayaris = filteredShayaris.filter(
        (s) => s.category === currentFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      filteredShayaris = filteredShayaris.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.author &&
            s.author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filteredShayaris.length === 0) {
      grid.innerHTML = "";
      if (emptyState) {
        emptyState.classList.add("show");
      }
    } else {
      if (emptyState) {
        emptyState.classList.remove("show");
      }
      grid.innerHTML = filteredShayaris
        .map((shayari) => this.createShayariCard(shayari))
        .join("");
    }
  }

  // Continuing from where your code left off...

  createShayariCard(shayari) {
    const categoryColors = {
      love: "💕",
      sad: "😢",
      motivational: "💪",
      friendship: "🤝",
      Notes:"📝",
    };

    return `
      <div class="shayari-card" data-id="${shayari.id}">
        <div class="card-header">
          <div class="category-badge">
            ${categoryColors[shayari.category] || "📝"} ${shayari.category}
          </div>
          <div class="card-actions">
            <button class="action-btn edit-btn" onclick="editShayariById(${shayari.id})" title="Edit">
              ✏️
            </button>
            <button class="action-btn duplicate-btn" onclick="duplicateShayariById(${shayari.id})" title="Duplicate">
              📄
            </button>
            <button class="action-btn delete-btn" onclick="deleteShayariById(${shayari.id})" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        <h3 class="card-title">${this.escapeHtml(shayari.title)}</h3>
        <div class="card-content">${this.formatContent(shayari.content)}</div>
        <div class="card-footer">
          ${shayari.author ? `<span class="author">~ ${this.escapeHtml(shayari.author)}</span>` : ''}
          <span class="date">${shayari.date}</span>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatContent(content) {
    return this.escapeHtml(content).replace(/\n/g, '<br>');
  }

  showContextMenu(event, card) {
    contextMenuTarget = card;
    const contextMenu = document.getElementById("contextMenu");
    if (!contextMenu) return;

    contextMenu.style.display = "block";
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;

    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = `${event.pageX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = `${event.pageY - rect.height}px`;
    }
  }

  showMobileContextMenu(id) {
    const shayari = shayaris.find(s => s.id === id);
    if (!shayari) return;

    const actions = [
      { text: 'Edit', action: () => this.openModal(shayari) },
      { text: 'Duplicate', action: () => this.duplicateShayari(id) },
      { text: 'Delete', action: () => this.deleteShayari(id) }
    ];

    this.showActionSheet(actions);
  }

  showActionSheet(actions) {
    const overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    `;

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.style.cssText = `
      background: var(--bg-color);
      border-radius: 20px 20px 0 0;
      padding: 20px;
      width: 100%;
      max-width: 400px;
      margin: 0 20px 20px 20px;
      box-shadow: var(--shadow-lg);
    `;

    actions.forEach(action => {
      const button = document.createElement('button');
      button.textContent = action.text;
      button.className = 'action-sheet-btn';
      button.style.cssText = `
        width: 100%;
        padding: 15px;
        margin: 5px 0;
        border: none;
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-color);
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      `;
      
      button.addEventListener('click', () => {
        action.action();
        document.body.removeChild(overlay);
      });
      
      sheet.appendChild(button);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'action-sheet-btn cancel';
    cancelBtn.style.cssText = `
      width: 100%;
      padding: 15px;
      margin: 10px 0 0 0;
      border: 2px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-color);
      color: var(--text-color);
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    `;
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    sheet.appendChild(cancelBtn);
    overlay.appendChild(sheet);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    document.body.appendChild(overlay);
  }

  hideContextMenu() {
    const contextMenu = document.getElementById("contextMenu");
    if (contextMenu) {
      contextMenu.style.display = "none";
    }
    contextMenuTarget = null;
  }

  updateStats() {
    const totalCount = document.getElementById("totalCount");
    const categoryStats = document.getElementById("categoryStats");

    if (totalCount) {
      totalCount.textContent = shayaris.length;
    }

    if (categoryStats) {
      const categories = {};
      shayaris.forEach(shayari => {
        categories[shayari.category] = (categories[shayari.category] || 0) + 1;
      });

      const statsHtml = Object.entries(categories)
        .map(([category, count]) => `
          <span class="stat-item">
            ${category}: ${count}
          </span>
        `).join('');
      
      categoryStats.innerHTML = statsHtml;
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      z-index: 10001;
      transform: translateX(400px);
      transition: all 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    notification.style.background = colors[type] || colors.success;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showConfirmDialog(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.style.cssText = `
      background: var(--bg-color);
      border-radius: 15px;
      padding: 30px;
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      text-align: center;
    `;

    dialog.innerHTML = `
      <p style="margin-bottom: 20px; font-size: 16px; color: var(--text-color);">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="confirm-btn" style="
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: var(--error-color);
          color: white;
          cursor: pointer;
          font-weight: 500;
        ">Yes, Delete</button>
        <button class="cancel-btn" style="
          padding: 10px 20px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-color);
          color: var(--text-color);
          cursor: pointer;
          font-weight: 500;
        ">Cancel</button>
      </div>
    `;

    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');

    confirmBtn.addEventListener('click', () => {
      onConfirm();
      document.body.removeChild(overlay);
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }
}

// Global helper functions for onclick events
function editShayariById(id) {
  const shayari = shayaris.find(s => s.id === id);
  if (shayari && shayariManager) {
    shayariManager.openModal(shayari);
  }
}

function duplicateShayariById(id) {
  if (shayariManager) {
    shayariManager.duplicateShayari(id);
  }
}

function deleteShayariById(id) {
  if (shayariManager) {
    shayariManager.deleteShayari(id);
  }
}

// Fix for modal close button
function closeModal() {
  if (shayariManager) {
    shayariManager.closeModal();
  }
}

// Enhanced modal close functionality
function enhanceModalCloseHandling() {
  const modal = document.getElementById("modalOverlay");
  const closeBtn = document.querySelector(".close-btn");
  
  if (closeBtn) {
    // Remove any existing event listeners
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    const newCloseBtn = document.querySelector(".close-btn");
    
    // Add new event listener
    newCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (shayariManager) {
        shayariManager.closeModal();
      }
    });
  }
  
  // Enhanced escape key handling
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("modalOverlay");
      if (modal && modal.classList.contains("show")) {
        e.preventDefault();
        if (shayariManager) {
          shayariManager.closeModal();
        }
      }
    }
  });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize cursor effect
  new CursorEffect();
  
  // Initialize theme manager
  new ThemeManager();
  
  // Initialize shayari manager
  shayariManager = new ShayariManager();
  
  // Enhance modal close handling
  setTimeout(() => {
    enhanceModalCloseHandling();
  }, 100);
  
  console.log("Shayari Collection Manager initialized successfully!");
});

// Handle page visibility changes to pause/resume animations
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page is hidden, could pause animations here
    console.log("Page hidden - animations could be paused");
  } else {
    // Page is visible again
    console.log("Page visible - animations resumed");
  }
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
