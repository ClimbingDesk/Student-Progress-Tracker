// Simple data storage using localStorage
const STORAGE_KEY = 'teacher_observations';

// Initialize date field to today
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('observation-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    loadObservations();
    updateStudentFilter();
});

// Load observations from localStorage
function loadObservations() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save observations to localStorage
function saveObservations(observations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

// Add new observation
document.getElementById('observation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const studentName = document.getElementById('student-name').value.trim();
    const date = document.getElementById('observation-date').value;
    const type = document.getElementById('observation-type').value;
    const notes = document.getElementById('observation-notes').value.trim();
    
    if (!studentName || !date || !type || !notes) {
        alert('Please fill in all fields.');
        return;
    }
    
    const observations = loadObservations();
    const newObservation = {
        id: Date.now(),
        studentName,
        date,
        type,
        notes,
        timestamp: new Date().toISOString()
    };
    
    observations.push(newObservation);
    saveObservations(observations);
    
    // Reset form
    document.getElementById('observation-form').reset();
    document.getElementById('observation-date').valueAsDate = new Date();
    
    // Refresh display
    displayProgressSheets();
    updateStudentFilter();
    
    // Show feedback
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.backgroundColor = '#16a34a';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
});

// Display progress sheets
function displayProgressSheets() {
    const observations = loadObservations();
    const selectedStudent = document.getElementById('student-filter').value;
    
    // Filter by student if selected
    const filtered = selectedStudent 
        ? observations.filter(obs => obs.studentName === selectedStudent)
        : observations;
    
    // Group by student
    const byStudent = {};
    filtered.forEach(obs => {
        if (!byStudent[obs.studentName]) {
            byStudent[obs.studentName] = [];
        }
        byStudent[obs.studentName].push(obs);
    });
    
    const container = document.getElementById('progress-sheets');
    
    if (Object.keys(byStudent).length === 0) {
        container.innerHTML = '<p class="empty-state">No observations yet. Add your first observation above.</p>';
        return;
    }
    
    // Sort students alphabetically
    const students = Object.keys(byStudent).sort();
    
    container.innerHTML = students.map(studentName => {
        const studentObs = byStudent[studentName].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        return createStudentSheet(studentName, studentObs);
    }).join('');
}

// Create HTML for a student's progress sheet
function createStudentSheet(studentName, observations) {
    // Calculate summary statistics
    const typeCounts = {};
    observations.forEach(obs => {
        typeCounts[obs.type] = (typeCounts[obs.type] || 0) + 1;
    });
    
    const totalObs = observations.length;
    const firstDate = observations[observations.length - 1].date;
    const lastDate = observations[0].date;
    
    const observationsHTML = observations.map(
        (obs) => `
        <div class="observation-item" data-observation-id="${obs.id}">
            <div class="observation-header">
                <span class="observation-type ${obs.type}">${obs.type}</span>
                <span class="observation-date">${formatDate(obs.date)}</span>
            </div>
            <label class="visually-hidden" for="note-${obs.id}">Notes for this observation</label>
            <textarea id="note-${obs.id}" class="observation-notes-input" rows="3" data-observation-id="${obs.id}">${escapeHtml(obs.notes)}</textarea>
            <div class="observation-item-actions sheet-action">
                <button type="button" class="btn-secondary btn-compact" data-action="save-note" data-observation-id="${obs.id}">Save note</button>
                <button type="button" class="btn-secondary btn-compact" data-action="duplicate-note" data-observation-id="${obs.id}">Duplicate note</button>
                <button type="button" class="btn-danger btn-compact" data-action="delete-note" data-observation-id="${obs.id}">Delete note</button>
            </div>
        </div>
    `
    ).join('');
    
    const nameFieldId = `sheet-name-${observations[0].id}`;
    return `
        <div class="student-sheet" data-student="${escapeAttr(studentName)}">
            <div class="student-header">
                <div class="student-name-block">
                    <label class="visually-hidden" for="${nameFieldId}">Student name</label>
                    <input type="text" class="student-name-input" id="${nameFieldId}" value="${escapeAttr(
        studentName
    )}" data-student-key="${escapeAttr(studentName)}" autocomplete="name" />
                    <div class="observation-count">${totalObs} observation${
        totalObs !== 1 ? 's' : ''
    } • ${formatDate(firstDate)} to ${formatDate(lastDate)}</div>
                    <button type="button" class="btn-secondary btn-compact sheet-action" data-action="save-student-name">Save name</button>
                </div>
            </div>
            <div class="observations-list">
                ${observationsHTML}
            </div>
            <div class="summary-section">
                <div class="summary-title">Summary</div>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${totalObs}</div>
                        <div class="stat-label">Total Observations</div>
                    </div>
                    ${Object.entries(typeCounts).map(([type, count]) => `
                        <div class="stat-item">
                            <div class="stat-value">${count}</div>
                            <div class="stat-label">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Update student filter dropdown
function updateStudentFilter() {
    const observations = loadObservations();
    const students = [...new Set(observations.map(obs => obs.studentName))].sort();
    const filter = document.getElementById('student-filter');
    
    const currentValue = filter.value;
    filter.innerHTML = '<option value="">All Students</option>' + 
        students.map(student => 
            `<option value="${escapeHtml(student)}">${escapeHtml(student)}</option>`
        ).join('');
    
    // Restore selection if still valid
    if (currentValue && students.includes(currentValue)) {
        filter.value = currentValue;
    }
    
    displayProgressSheets();
}

// Student filter change
document.getElementById('student-filter').addEventListener('change', () => {
    displayProgressSheets();
});

// Print button
document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
});

// Clear all button
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all observations? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        displayProgressSheets();
        updateStudentFilter();
    }
});

function downloadTextFile(text, filename, mimeType) {
    const blob = new Blob([text], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatExportDateStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function observationsToCsv(observations) {
    const header = ['id', 'studentName', 'date', 'type', 'notes', 'timestamp'];
    const rows = [header];
    for (const obs of observations) {
        rows.push(
            [obs.id, obs.studentName, obs.date, obs.type, obs.notes, obs.timestamp].map(
                (cell) => csvEscapeField(cell)
            )
        );
    }
    return rows.map((r) => r.join(',')).join('\r\n');
}

function csvEscapeField(value) {
    if (value == null) return '""';
    const s = String(value);
    if (/[",\r\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

document.getElementById('export-csv-btn').addEventListener('click', () => {
    const observations = loadObservations();
    if (observations.length === 0) {
        alert('No observations to export yet.');
        return;
    }
    const csv = observationsToCsv(observations);
    const filename = `student-progress-observations-${formatExportDateStamp()}.csv`;
    downloadTextFile('\ufeff' + csv, filename, 'text/csv');
});

document.getElementById('export-json-btn').addEventListener('click', () => {
    const observations = loadObservations();
    if (observations.length === 0) {
        alert('No observations to export yet.');
        return;
    }
    const json = JSON.stringify(observations, null, 2);
    const filename = `student-progress-backup-${formatExportDateStamp()}.json`;
    downloadTextFile(json, filename, 'application/json');
});

function renameStudentInStorage(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
        alert('Please enter a student name.');
        return;
    }
    if (oldName === trimmed) return;
    const observations = loadObservations();
    if (observations.some((o) => o.studentName === trimmed && o.studentName !== oldName)) {
        alert('Another student already has that name. Choose a different name.');
        return;
    }
    const filterEl = document.getElementById('student-filter');
    const hadThisStudentFilter = filterEl.value === oldName;
    for (const o of observations) {
        if (o.studentName === oldName) o.studentName = trimmed;
    }
    saveObservations(observations);
    updateStudentFilter();
    if (hadThisStudentFilter) {
        filterEl.value = trimmed;
    }
    displayProgressSheets();
}

function updateObservationNoteById(id, newNotes) {
    const trimmed = newNotes.trim();
    if (!trimmed) {
        alert('Notes cannot be empty.');
        return;
    }
    const numId = Number(id);
    const observations = loadObservations();
    const o = observations.find((x) => x.id === numId);
    if (!o) return;
    o.notes = trimmed;
    saveObservations(observations);
    displayProgressSheets();
}

function todayLocalDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
    ).padStart(2, '0')}`;
}

function duplicateObservationById(id) {
    const numId = Number(id);
    const observations = loadObservations();
    const source = observations.find((x) => x.id === numId);
    if (!source) return;
    const item = document.querySelector(`.observation-item[data-observation-id="${numId}"]`);
    const ta = item && item.querySelector('.observation-notes-input');
    const notes = (ta ? ta.value : source.notes).trim();
    if (!notes) {
        alert('Add some note text before duplicating, or the copy would be empty.');
        return;
    }
    const copy = {
        id: Date.now(),
        studentName: source.studentName,
        date: todayLocalDateString(),
        type: source.type,
        notes,
        timestamp: new Date().toISOString()
    };
    observations.push(copy);
    saveObservations(observations);
    displayProgressSheets();
}

function deleteObservationById(id) {
    if (!confirm('Delete this note? This cannot be undone.')) {
        return;
    }
    const numId = Number(id);
    const observations = loadObservations().filter((o) => o.id !== numId);
    saveObservations(observations);
    updateStudentFilter();
}

document.getElementById('progress-sheets').addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.getAttribute('data-action') === 'save-student-name') {
        const sheet = t.closest('.student-sheet');
        if (!sheet) return;
        const input = sheet.querySelector('.student-name-input');
        if (!input) return;
        const oldName = input.getAttribute('data-student-key') || '';
        renameStudentInStorage(oldName, input.value);
        return;
    }
    if (t.getAttribute('data-action') === 'save-note') {
        const id = t.getAttribute('data-observation-id');
        if (!id) return;
        const item = t.closest('.observation-item');
        const ta = item ? item.querySelector('.observation-notes-input') : null;
        if (!ta) return;
        updateObservationNoteById(id, ta.value);
        return;
    }
    if (t.getAttribute('data-action') === 'duplicate-note') {
        const id = t.getAttribute('data-observation-id');
        if (id) duplicateObservationById(id);
        return;
    }
    if (t.getAttribute('data-action') === 'delete-note') {
        const id = t.getAttribute('data-observation-id');
        if (id) deleteObservationById(id);
    }
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text == null) return '';
    return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// Initial display
displayProgressSheets();

