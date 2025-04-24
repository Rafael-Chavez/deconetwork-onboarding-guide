        // Initialize the checklist
        document.addEventListener('DOMContentLoaded', function() {
            loadChecklist();
            
            // Open first section by default
            const firstSection = document.querySelector('.section-header');
            if (firstSection) {
                toggleSection(firstSection);
            }
            
            updateProgress();
        });
        
        function toggleSection(header) {
            const content = header.nextElementSibling;
            const allSections = document.querySelectorAll('.section-content');
            
            // Close all other sections
            allSections.forEach(section => {
                if (section !== content) {
                    section.classList.remove('active');
                }
            });
            
            // Toggle current section
            content.classList.toggle('active');
        }
        
        function updateProgress() {
            let totalTasks = 0;
            let completedTasks = 0;
            const sections = document.querySelectorAll('.section');
            
            sections.forEach((section, sectionIndex) => {
                const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                const sectionCompleted = Array.from(checkboxes).filter(cb => cb.checked).length;
                const sectionTotal = checkboxes.length;
                
                // Update section progress
                section.querySelector('.section-progress').textContent = `${sectionCompleted}/${sectionTotal}`;
                
                totalTasks += sectionTotal;
                completedTasks += sectionCompleted;
                
                // Update completion dates
                checkboxes.forEach((checkbox, index) => {
                    const taskId = checkbox.id;
                    const dateElement = document.getElementById(`date-${sectionIndex + 1}-${index + 1}`);
                    
                    if (checkbox.checked && !dateElement.textContent) {
                        const today = new Date();
                        const formattedDate = today.toLocaleDateString();
                        dateElement.textContent = `Completed: ${formattedDate}`;
                    } else if (!checkbox.checked) {
                        dateElement.textContent = '';
                    }
                });
            });
            
            // Update overall progress
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            document.getElementById('overall-progress').style.width = `${progressPercentage}%`;
            document.getElementById('progress-text').textContent = `${progressPercentage}% complete (${completedTasks}/${totalTasks} tasks)`;
            
            // Apply completed class to items
            document.querySelectorAll('.checklist-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox.checked) {
                    item.classList.add('completed');
                } else {
                    item.classList.remove('completed');
                }
            });
            
            // Auto-save when changes are made
            saveChecklist();
        }
        
        function saveChecklist() {
            const checklistData = {
                tasks: {},
                notes: {},
                dates: {}
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
                checklistData.dates[dateElement.id] = dateElement.textContent;
            });
            
            localStorage.setItem('decoNetworkChecklist', JSON.stringify(checklistData));
            
            // Show save confirmation
            const saveButton = document.querySelector('button');
            const originalText = saveButton.textContent;
            saveButton.textContent = 'Progress Saved!';
            setTimeout(() => {
                saveButton.textContent = originalText;
            }, 1500);
        }
        
        function saveNotes() {
            saveChecklist();
        }
        
        function loadChecklist() {
            const savedData = localStorage.getItem('decoNetworkChecklist');
            
            if (savedData) {
                const checklistData = JSON.parse(savedData);
                
                // Load checkbox states
                if (checklistData.tasks) {
                    Object.keys(checklistData.tasks).forEach(taskId => {
                        const checkbox = document.getElementById(taskId);
                        if (checkbox) {
                            checkbox.checked = checklistData.tasks[taskId];
                        }
                    });
                }
                
                // Load notes
                if (checklistData.notes) {
                    Object.keys(checklistData.notes).forEach(noteId => {
                        const textarea = document.getElementById(noteId);
                        if (textarea) {
                            textarea.value = checklistData.notes[noteId];
                        }
                    });
                }
                
                // Load completion dates
                if (checklistData.dates) {
                    Object.keys(checklistData.dates).forEach(dateId => {
                        const dateElement = document.getElementById(dateId);
                        if (dateElement) {
                            dateElement.textContent = checklistData.dates[dateId];
                        }
                    });
                }
            }
        }
        
        function resetChecklist() {
            if (confirm('Are you sure you want to reset the checklist? All progress will be lost.')) {
                localStorage.removeItem('decoNetworkChecklist');
                
                // Uncheck all checkboxes
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Clear all notes
                document.querySelectorAll('textarea').forEach(textarea => {
                    textarea.value = '';
                });
                
                // Clear all dates
                document.querySelectorAll('.date-completed').forEach(dateElement => {
                    dateElement.textContent = '';
                });
                
                // Update progress
                updateProgress();
            }
        }
        
        function exportChecklist() {
            const sections = document.querySelectorAll('.section');
            let reportContent = "# DecoNetwork Pre-Launch Checklist Report\n\n";
            reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
            
            // Add overall progress
            const progressText = document.getElementById('progress-text').textContent;
            reportContent += `## Overall Progress\n${progressText}\n\n`;
            
            // Process each section
            sections.forEach(section => {
                const sectionTitle = section.querySelector('.section-header span').textContent;
                const sectionProgress = section.querySelector('.section-progress').textContent;
                reportContent += `## ${sectionTitle} (${sectionProgress})\n\n`;
                
                // Process tasks in this section
                const tasks = section.querySelectorAll('.checklist-item');
                tasks.forEach(task => {
                    const checkbox = task.querySelector('input[type="checkbox"]');
                    const label = task.querySelector('label').textContent;
                    const dateCompleted = task.querySelector('.date-completed').textContent;
                    
                    const status = checkbox.checked ? "✓" : "☐";
                    reportContent += `- ${status} ${label} ${dateCompleted ? `(${dateCompleted})` : ''}\n`;
                });
                
                // Add notes for this section
                const sectionId = section.querySelector('.section-content textarea').id;
                const notesValue = document.getElementById(sectionId).value;
                if (notesValue.trim()) {
                    reportContent += `\n**Notes:**\n${notesValue}\n`;
                }
                
                reportContent += "\n";
            });
            
            // Create a download link
            const blob = new Blob([reportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deco-network-checklist-${new Date().toISOString().slice(0,10)}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }