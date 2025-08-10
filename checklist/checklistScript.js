// Enhanced Checklist Management System
class ChecklistManager {
    constructor() {
        this.storageKey = 'decoNetworkChecklist';
        this.data = {
            tasks: {},
            notes: {},
            dates: {},
            estimatedTimes: {
                'task-1': 30, // minutes
                'task-2': 45,
                'task-3': 25
            }
        };
        this.totalTasks = 0;
        this.completedTasks = 0;
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadChecklist();
            this.setupEventListeners();
            this.openFirstSection();
            this.updateProgress();
            this.updateEstimatedTime();
            this.setupKeyboardNavigation();
            this.setupTooltips();
        });
    }
    
    setupEventListeners() {
        // Add event listeners for checkboxes with debouncing
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleTaskChange(e);
                this.celebrateCompletion(e.target);
            });
        });
        
        // Add event listeners for notes with auto-save
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => this.debouncedSave());
            textarea.addEventListener('blur', () => this.saveChecklist());
        });
        
        // Enhanced section toggle
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => this.toggleSection(header));
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSection(header);
                }
            });
        });
        
        // Button enhancements
        this.setupButtonListeners();
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => this.saveChecklist());
        
        // Theme preference detection
        this.detectThemePreference();
        
        // Periodic auto-save
        setInterval(() => this.saveChecklist(), 30000); // Every 30 seconds
    }
    
    setupButtonListeners() {
        const saveBtn = document.querySelector('button[onclick="saveChecklist()"]');
        const exportBtn = document.querySelector('button[onclick="exportChecklist()"]');
        const resetBtn = document.querySelector('button[onclick="resetChecklist()"]');
        
        if (saveBtn) {
            saveBtn.onclick = () => this.saveChecklistWithFeedback();
        }
        
        if (exportBtn) {
            exportBtn.onclick = () => this.exportChecklistEnhanced();
        }
        
        if (resetBtn) {
            resetBtn.onclick = () => this.resetChecklistWithConfirmation();
        }
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveChecklistWithFeedback();
            }
            
            // Ctrl/Cmd + E to export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportChecklistEnhanced();
            }
            
            // Arrow key navigation for sections
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                this.navigateSections(e.key === 'ArrowDown' ? 1 : -1);
            }
        });
    }
    
    setupTooltips() {
        // Add helpful tooltips to various elements
        const tooltips = {
            'progress-bar': 'Click sections below to expand and complete tasks',
            'section-progress': 'Shows completed tasks in this section',
            'notes-area': 'Add your personal notes and reminders here'
        };
        
        Object.entries(tooltips).forEach(([className, text]) => {
            document.querySelectorAll(`.${className}`).forEach(el => {
                el.title = text;
            });
        });
    }
    
    toggleSection(header) {
        const content = header.nextElementSibling;
        const expandIcon = header.querySelector('.expand-icon');
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        
        // Close all other sections (accordion behavior)
        document.querySelectorAll('.section-content').forEach(section => {
            if (section !== content) {
                section.classList.remove('active');
                const otherHeader = section.previousElementSibling;
                if (otherHeader) {
                    otherHeader.setAttribute('aria-expanded', 'false');
                    const otherIcon = otherHeader.querySelector('.expand-icon');
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Toggle current section
        if (isExpanded) {
            content.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
        } else {
            content.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
            if (expandIcon) expandIcon.style.transform = 'rotate(180deg)';
            
            // Smooth scroll to section
            setTimeout(() => {
                header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        
        // Update section completion visual
        this.updateSectionCompletionState(header.parentElement);
    }
    
    openFirstSection() {
        const firstSection = document.querySelector('.section-header');
        if (firstSection) {
            this.toggleSection(firstSection);
        }
    }
    
    handleTaskChange(event) {
        const checkbox = event.target;
        const taskId = checkbox.id;
        const isChecked = checkbox.checked;
        
        // Update task completion date
        this.updateTaskCompletionDate(taskId, isChecked);
        
        // Add visual feedback
        const item = checkbox.closest('.checklist-item');
        if (item) {
            item.classList.toggle('completed', isChecked);
            
            // Animate the change
            if (isChecked) {
                item.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 200);
            }
        }
        
        // Update progress
        this.updateProgress();
        this.updateEstimatedTime();
        
        // Auto-save
        this.debouncedSave();
        
        // Check if section is complete
        const section = checkbox.closest('.section');
        if (section) {
            this.updateSectionCompletionState(section);
        }
    }
    
    celebrateCompletion(checkbox) {
        if (!checkbox.checked) return;
        
        // Add celebration animation
        const label = checkbox.nextElementSibling;
        if (label) {
            label.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                label.style.animation = '';
            }, 500);
        }
        
        // Check if all tasks are completed
        if (this.completedTasks === this.totalTasks && this.totalTasks > 0) {
            this.showCompletionCelebration();
        }
    }
    
    showCompletionCelebration() {
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>Congratulations!</h2>
                <p>You've completed your DecoNetwork setup checklist!</p>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                    Continue to Launch
                </button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Add celebration styles
        const style = document.createElement('style');
        style.textContent = `
            .celebration-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.5s ease;
            }
            .celebration-content {
                background: white;
                padding: 3rem;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                animation: slideUp 0.5s ease;
            }
            .celebration-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 1s infinite;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-30px); }
                60% { transform: translateY(-15px); }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (celebration.parentElement) {
                celebration.remove();
                style.remove();
            }
        }, 10000);
    }
    
    updateTaskCompletionDate(taskId, isCompleted) {
        const sectionMatch = taskId.match(/task-(\d+)-(\d+)/);
        if (!sectionMatch) return;
        
        const sectionIndex = parseInt(sectionMatch[1]);
        const taskIndex = parseInt(sectionMatch[2]);
        const dateElementId = `date-${sectionIndex}-${taskIndex}`;
        const dateElement = document.getElementById(dateElementId);
        
        if (dateElement) {
            if (isCompleted && !dateElement.textContent) {
                const now = new Date();
                const formattedDate = now.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                dateElement.textContent = `Completed: ${formattedDate}`;
                dateElement.style.opacity = '0';
                dateElement.style.animation = 'fadeIn 0.5s ease forwards';
            } else if (!isCompleted) {
                dateElement.textContent = '';
            }
        }
    }
    
    updateProgress() {
        let totalTasks = 0;
        let completedTasks = 0;
        
        // Update each section progress
        document.querySelectorAll('.section').forEach((section, sectionIndex) => {
            const checkboxes = section.querySelectorAll('input[type="checkbox"]');
            const sectionCompleted = Array.from(checkboxes).filter(cb => cb.checked).length;
            const sectionTotal = checkboxes.length;
            
            // Update section progress display
            const progressElement = section.querySelector('.section-progress');
            if (progressElement) {
                progressElement.textContent = `${sectionCompleted}/${sectionTotal}`;
                
                // Update progress color based on completion
                if (sectionCompleted === sectionTotal && sectionTotal > 0) {
                    progressElement.style.background = 'var(--success)';
                } else if (sectionCompleted > 0) {
                    progressElement.style.background = 'var(--warning)';
                } else {
                    progressElement.style.background = 'var(--primary)';
                }
            }
            
            totalTasks += sectionTotal;
            completedTasks += sectionCompleted;
        });
        
        // Update overall progress
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Update progress bar with animation
        const progressFill = document.getElementById('overall-progress');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${progressPercentage}% complete (${completedTasks}/${totalTasks} tasks)`;
        }
        
        // Update completion states
        this.updateCompletionStates();
        
        // Update estimated time
        this.updateEstimatedTime();
    }
    
    updateEstimatedTime() {
        const remainingTasks = this.totalTasks - this.completedTasks;
        const avgTimePerTask = 15; // minutes
        const estimatedMinutes = remainingTasks * avgTimePerTask;
        
        const estimatedTimeElement = document.getElementById('estimated-time');
        if (estimatedTimeElement) {
            if (remainingTasks === 0) {
                estimatedTimeElement.textContent = 'Complete! 🎉';
                estimatedTimeElement.style.color = 'var(--success)';
            } else if (estimatedMinutes < 60) {
                estimatedTimeElement.textContent = `~${estimatedMinutes} min`;
            } else {
                const hours = Math.round(estimatedMinutes / 60 * 10) / 10;
                estimatedTimeElement.textContent = `~${hours} hours`;
            }
        }
    }
    
    updateCompletionStates() {
        document.querySelectorAll('.checklist-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                item.classList.toggle('completed', checkbox.checked);
            }
        });
    }
    
    updateSectionCompletionState(section) {
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        const completedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const isComplete = completedCount === checkboxes.length && checkboxes.length > 0;
        
        section.classList.toggle('completed', isComplete);
        
        if (isComplete) {
            // Add completion indicator
            const header = section.querySelector('.section-header');
            if (header && !header.querySelector('.completion-badge')) {
                const badge = document.createElement('span');
                badge.className = 'completion-badge';
                badge.innerHTML = '✓';
                badge.style.cssText = `
                    background: var(--success);
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    margin-left: 8px;
                    animation: bounceIn 0.5s ease;
                `;
                header.querySelector('.section-title').appendChild(badge);
            }
        } else {
            // Remove completion indicator
            const badge = section.querySelector('.completion-badge');
            if (badge) {
                badge.remove();
            }
        }
    }
    
    debouncedSave() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveChecklist();
        }, 1000);
    }
    
    saveChecklist() {
        const checklistData = {
            tasks: {},
            notes: {},
            dates: {},
            lastSaved: new Date().toISOString(),
            version: '2.0'
        };
        
        // Save checkbox states
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checklistData.tasks[checkbox.id] = checkbox.checked;
        });
        
        // Save notes
        document.querySelectorAll('textarea').forEach(textarea => {
            checklistData.notes[textarea.id] = textarea.value;
        });
        
        // Save completion dates
        document.querySelectorAll('.date-completed').forEach(dateElement => {
            if (dateElement.textContent) {
                checklistData.dates[dateElement.id] = dateElement.textContent;
            }
        });
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(checklistData));
            return true;
        } catch (error) {
            console.error('Failed to save checklist:', error);
            this.showNotification('Save failed. Please try again.', 'error');
            return false;
        }
    }
    
    saveChecklistWithFeedback() {
        const saveButton = document.querySelector('button[onclick*="saveChecklist"]');
        if (!saveButton) return;
        
        const originalText = saveButton.innerHTML;
        saveButton.classList.add('loading');
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
        
        setTimeout(() => {
            const success = this.saveChecklist();
            
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
            
            if (success) {
                saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
                saveButton.style.background = 'var(--success)';
                this.showNotification('Progress saved successfully!', 'success');
            } else {
                saveButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Save Failed';
                saveButton.style.background = 'var(--error)';
            }
            
            setTimeout(() => {
                saveButton.innerHTML = originalText;
                saveButton.style.background = '';
            }, 2000);
        }, 500);
    }
    
    loadChecklist() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return;
            
            const checklistData = JSON.parse(savedData);
            
            // Load checkbox states
            if (checklistData.tasks) {
                Object.entries(checklistData.tasks).forEach(([taskId, isChecked]) => {
                    const checkbox = document.getElementById(taskId);
                    if (checkbox) {
                        checkbox.checked = isChecked;
                    }
                });
            }
            
            // Load notes
            if (checklistData.notes) {
                Object.entries(checklistData.notes).forEach(([noteId, content]) => {
                    const textarea = document.getElementById(noteId);
                    if (textarea) {
                        textarea.value = content;
                    }
                });
            }
            
            // Load completion dates
            if (checklistData.dates) {
                Object.entries(checklistData.dates).forEach(([dateId, dateText]) => {
                    const dateElement = document.getElementById(dateId);
                    if (dateElement) {
                        dateElement.textContent = dateText;
                    }
                });
            }
            
            // Show last saved info
            if (checklistData.lastSaved) {
                const lastSaved = new Date(checklistData.lastSaved);
                const timeAgo = this.getTimeAgo(lastSaved);
                this.showNotification(`Data loaded from ${timeAgo}`, 'info', 3000);
            }
            
        } catch (error) {
            console.error('Failed to load checklist:', error);
            this.showNotification('Failed to load saved data', 'error');
        }
    }
    
    resetChecklistWithConfirmation() {
        const modal = document.createElement('div');
        modal.className = 'reset-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>Reset Checklist</h3>
                    <p>Are you sure you want to reset all progress? This action cannot be undone.</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.reset-modal').remove()">Cancel</button>
                        <button class="btn btn-reset" onclick="checklistManager.confirmReset()">Reset All</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .reset-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-overlay {
                background: rgba(0, 0, 0, 0.7);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                animation: slideUp 0.3s ease;
            }
            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 1.5rem;
            }
            .btn-secondary {
                background: var(--border);
                color: var(--text);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
                style.remove();
            }
        });
    }
    
    confirmReset() {
        // Remove modal
        document.querySelector('.reset-modal')?.remove();
        
        // Clear storage
        localStorage.removeItem(this.storageKey);
        
        // Reset UI
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
        });
        
        document.querySelectorAll('.date-completed').forEach(dateElement => {
            dateElement.textContent = '';
        });
        
        // Remove completion badges
        document.querySelectorAll('.completion-badge').forEach(badge => {
            badge.remove();
        });
        
        // Update progress
        this.updateProgress();
        this.showNotification('Checklist has been reset', 'success');
    }
    
    exportChecklistEnhanced() {
        const exportButton = document.querySelector('button[onclick*="exportChecklist"]');
        if (exportButton) {
            exportButton.classList.add('loading');
            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
        
        setTimeout(() => {
            const sections = document.querySelectorAll('.section');
            let reportContent = "# DecoNetwork Pre-Launch Checklist Report\\n\\n";
            reportContent += `Generated on: ${new Date().toLocaleString()}\\n`;
            reportContent += `Progress: ${this.completedTasks}/${this.totalTasks} tasks completed\\n\\n`;
            
            // Add overall statistics
            const completionRate = this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
            reportContent += `## Summary\\n`;
            reportContent += `- **Overall Progress:** ${completionRate}%\\n`;
            reportContent += `- **Completed Tasks:** ${this.completedTasks}\\n`;
            reportContent += `- **Remaining Tasks:** ${this.totalTasks - this.completedTasks}\\n`;
            reportContent += `- **Status:** ${completionRate === 100 ? 'Ready to Launch! 🚀' : 'In Progress'}\\n\\n`;
            
            // Process each section
            sections.forEach((section, index) => {
                const sectionTitle = section.querySelector('.section-header span').textContent;
                const sectionProgress = section.querySelector('.section-progress').textContent;
                reportContent += `## ${sectionTitle} (${sectionProgress})\\n\\n`;
                
                // Process tasks in this section
                const tasks = section.querySelectorAll('.checklist-item');
                tasks.forEach(task => {
                    const checkbox = task.querySelector('input[type="checkbox"]');
                    const label = task.querySelector('label').textContent;
                    const dateCompleted = task.querySelector('.date-completed').textContent;
                    
                    const status = checkbox.checked ? "✅" : "⭕";
                    reportContent += `${status} ${label} ${dateCompleted ? `(${dateCompleted})` : ''}\\n`;
                });
                
                // Add notes for this section
                const textarea = section.querySelector('textarea');
                if (textarea && textarea.value.trim()) {
                    reportContent += `\\n**Notes:**\\n${textarea.value.trim()}\\n`;
                }
                
                reportContent += "\\n";
            });
            
            // Add footer
            reportContent += `---\\n`;
            reportContent += `*Report generated by DecoNetwork Checklist Manager*\\n`;
            reportContent += `*Visit [DecoNetwork](https://www.deconetwork.com) for more information*`;
            
            // Create and download file
            const blob = new Blob([reportContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deconetwork-checklist-${new Date().toISOString().slice(0,10)}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Reset button
            if (exportButton) {
                exportButton.classList.remove('loading');
                exportButton.innerHTML = '<i class="fas fa-download"></i> Export Report';
            }
            
            this.showNotification('Checklist exported successfully!', 'success');
        }, 1000);
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    color: white;
                    font-weight: 500;
                }
                .notification-success .notification-content {
                    background: var(--success);
                }
                .notification-error .notification-content {
                    background: var(--error);
                }
                .notification-info .notification-content {
                    background: var(--primary);
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    navigateSections(direction) {
        const headers = Array.from(document.querySelectorAll('.section-header'));
        const activeHeader = document.querySelector('.section-header[aria-expanded="true"]');
        
        if (!activeHeader) {
            if (headers.length > 0) {
                this.toggleSection(headers[0]);
            }
            return;
        }
        
        const currentIndex = headers.indexOf(activeHeader);
        const nextIndex = currentIndex + direction;
        
        if (nextIndex >= 0 && nextIndex < headers.length) {
            this.toggleSection(headers[nextIndex]);
        }
    }
    
    detectThemePreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme-preferred');
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

// Initialize the enhanced checklist manager
const checklistManager = new ChecklistManager();

// Simple initialization that should always work
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Open first section by default
    const firstHeader = document.querySelector('.section-header');
    if (firstHeader) {
        console.log('Opening first section...');
        setTimeout(() => {
            toggleSection(firstHeader);
        }, 100);
    }
    
    // Add click listeners to all headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            console.log('Header clicked:', this);
            toggleSection(this);
        });
    });
    
    console.log('Initialization complete');
});

// Legacy function compatibility - Simplified for debugging
function toggleSection(header) {
    console.log('Toggle section called:', header);
    
    // Simple toggle logic that should work
    const content = header.nextElementSibling;
    if (!content) {
        console.log('No content found for header:', header);
        return;
    }
    
    console.log('Content element:', content);
    
    // Close all other sections first
    document.querySelectorAll('.section-content').forEach(section => {
        if (section !== content) {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    });
    
    // Toggle current section
    const isActive = content.classList.contains('active');
    if (isActive) {
        content.classList.remove('active');
        content.style.display = 'none';
    } else {
        content.classList.add('active');
        content.style.display = 'block';
    }
    
    console.log('Section toggled, isActive was:', isActive, 'now showing:', !isActive);
}

function updateProgress() {
    checklistManager.updateProgress();
}

function saveChecklist() {
    return checklistManager.saveChecklistWithFeedback();
}

function saveNotes() {
    checklistManager.debouncedSave();
}

function resetChecklist() {
    checklistManager.resetChecklistWithConfirmation();
}

function exportChecklist() {
    checklistManager.exportChecklistEnhanced();
}