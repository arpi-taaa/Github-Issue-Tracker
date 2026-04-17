let allIssues = [];
const issuesContainer = document.getElementById('issuesContainer');
const loadingSpinner = document.getElementById('loadingSpinner');

// Helper to pick colors based on label name
function getLabelStyle(label) {
    const l = (label || '').toLowerCase();
    if (l === 'bug') return 'bg-red-50 text-red-500 border-red-100';
    if (l === 'enhancement') return 'bg-green-50 text-green-500 border-green-100';
    if (l === 'help wanted') return 'bg-orange-50 text-orange-500 border-orange-100';
    // Default blue for others
    return 'bg-blue-50 text-blue-500 border-blue-100';
}

// 1. Unified Initial Data Fetch
async function loadData() {
    toggleSpinner(true);
    try {
        const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
        const data = await res.json();
        
        console.log("Initial Load API Result:", data);

        allIssues = data.data ? data.data : data; 
        
        if (Array.isArray(allIssues)) {
            displayIssues(allIssues);
        } else {
            console.error("Data is not an array:", allIssues);
            document.getElementById('issueCount').innerText = "Error";
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        toggleSpinner(false);
    }
}

// 2. Display Cards
function displayIssues(issues) {
    const countElement = document.getElementById('issueCount');
    const container = document.getElementById('issuesContainer');

    if (!container) return;
    container.classList.remove('hidden'); 

    if (!Array.isArray(issues) || issues.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">No issues found.</div>`;
        if(countElement) countElement.innerText = "0";
        return;
    }

    if(countElement) countElement.innerText = issues.length;

    container.innerHTML = issues.map(issue => {
        const issueId = issue._id || issue.id || '0000';
        const status = (issue.status || 'open').toLowerCase();
        const priority = issue.priority || 'Low';
        const author = issue.author || 'Unknown';
        const title = issue.title || 'No Title';
        const description = issue.description || 'No description provided.';
        
        const topBorder = status === 'open' ? 'border-green-500' : 'border-purple-500';
        const priorityColor = priority === 'High' ? 'bg-red-100 text-red-600' : 
                             priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600';

        // DYNAMIC BADGE LOGIC
        // If your API sends an array called 'labels', we map it. 
        // If it's a single string called 'label', we wrap it in an array to use the same logic.
        const labels = Array.isArray(issue.labels) ? issue.labels : [issue.label || 'Bug'];

        return `
        <div onclick="showDetails('${issueId}')" class="group bg-white border border-gray-200 border-t-4 ${topBorder} rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div class="flex justify-between items-start mb-2">
                 <div class="w-8 h-8 rounded-full ${status === 'open' ? 'bg-green-50' : 'bg-purple-50'} flex items-center justify-center">
                    <i class="fa-solid ${status === 'open' ? 'fa-circle-dot text-green-500' : 'fa-circle-check text-purple-500'} text-xs"></i>
                 </div>
                 <span class="text-[10px] font-bold uppercase px-2 py-1 rounded ${priorityColor}">${priority}</span>
            </div>
            
            <h3 class="font-bold text-gray-800 text-sm mb-1 group-hover:text-indigo-600">${title}</h3>
            <p class="text-xs text-gray-500 line-clamp-2 mb-3">${description}</p>
            
            <div class="flex flex-wrap gap-1 mb-4">
                ${labels.map(l => `
                    <span class="${getLabelStyle(l)} text-[10px] px-2 py-0.5 rounded-full border">
                        ● ${l}
                    </span>
                `).join('')}
            </div>

            <div class="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                <p>#${issueId.toString().slice(-4)} by ${author}</p>
                <p>${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'No Date'}</p>
            </div>
        </div>
        `;
    }).join('');
}

// 3. Tab Filtering Logic
function filterIssues(status) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#5800FF]', 'text-white');
        btn.classList.add('bg-white', 'text-gray-600');
    });
    
    const activeBtn = document.getElementById(`tab-${status}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-gray-600');
        activeBtn.classList.add('bg-[#5800FF]', 'text-white');
    }

    if (status === 'all') {
        displayIssues(allIssues);
    } else {
        const filtered = allIssues.filter(item => item.status.toLowerCase() === status.toLowerCase());
        displayIssues(filtered);
    }
}

// 4. Search Functionality
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (!query) {
        return loadData(); 
    }

    toggleSpinner(true);
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${query}`);
        const result = await res.json();
        
        let searchData = result.data ? result.data : result;

        if (Array.isArray(searchData) && searchData.length > 0) {
            displayIssues(searchData);
        } else {
            issuesContainer.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <i class="fa-solid fa-face-frown text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">No issues found matching "${query}"</p>
                    <button onclick="loadData()" class="mt-4 text-indigo-600 underline">Clear search and show all</button>
                </div>
            `;
            document.getElementById('issueCount').innerText = "0";
        }
    } catch (err) {
        console.error("Search Error:", err);
    } finally {
        toggleSpinner(false);
    }
}

// 5. Modal Logic
async function showDetails(id) {
    if (!id || id === 'undefined') return;

    const modal = document.getElementById('issueModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `<div class="p-20 text-center"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div></div>`;
    modal.showModal();

    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
        const result = await res.json();
        const issue = result.data ? result.data : result;

        if (!issue || (result.status && result.status === "fail")) throw new Error("Issue not found");

        const dateStr = new Date(issue.createdAt).toLocaleDateString('en-GB');
        
        // DYNAMIC BADGE LOGIC FOR MODAL
        const labels = Array.isArray(issue.labels) ? issue.labels : [issue.label || 'Bug'];

        content.innerHTML = `
            <div class="p-8 bg-white rounded-xl relative max-w-2xl">
                <h2 class="text-2xl font-bold text-slate-800 mb-3">${issue.title}</h2>
                
                <div class="flex items-center gap-3 mb-4 text-sm text-gray-500">
                    <span class="bg-green-500 text-white px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <i class="fa-solid fa-circle-dot text-[10px]"></i> Opened
                    </span>
                    <span>• Opened by <span class="font-semibold text-gray-700">${issue.author}</span></span>
                    <span>• ${dateStr}</span>
                </div>

                <div class="flex gap-2 mb-6">
                    ${labels.map(l => `
                        <span class="border ${getLabelStyle(l)} px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1">
                             ${l}
                        </span>
                    `).join('')}
                </div>

                <p class="text-gray-600 leading-relaxed mb-8 text-sm">
                    ${issue.description}
                </p>

                <div class="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6 mb-8">
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-1">Assignee:</p>
                        <p class="font-bold text-slate-800">${issue.author}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-bold mb-1">Priority:</p>
                        <span class="bg-red-500 text-white px-3 py-0.5 rounded text-[11px] font-bold uppercase">
                            ${issue.priority}
                        </span>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button onclick="document.getElementById('issueModal').close()" 
                        class="bg-[#5800FF] hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md">
                        Close
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        content.innerHTML = `<div class="p-12 text-center text-red-500 font-bold">Error loading issue data.</div>`;
    }
}

function toggleSpinner(show) {
    if (loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
    if (issuesContainer) issuesContainer.classList.toggle('hidden', show);
}

document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSearch();
});

loadData();