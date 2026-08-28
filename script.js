// =====================================
// SUPABASE
// =====================================

const SUPABASE_URL =
"https://wnorajpknqegnnmeotjf.supabase.co";


const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indub3JhanBrbnFlZ25ubWVvdGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzI4MDksImV4cCI6MjA3Njk0ODgwOX0._o-I1p-gWcebttbnCnTjwZxHQaNysu2CbsxaJ9uggOE";


const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =====================================
// USER ID (Update this with actual user ID)
// =====================================

const CURRENT_USER_ID = "63589afd-c745-4360-b6b9-10d663f9db07";


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener(
"DOMContentLoaded",
function() {

    // Login Button
    document
    .getElementById("loginBtn")
    .addEventListener(
    "click",
    login
    );

    // Search Button
    document
    .getElementById("searchBtn")
    .addEventListener(
    "click",
    searchVehicle
    );

    // Logout Button
    document
    .getElementById("logoutBtn")
    .addEventListener(
    "click",
    logout
    );

    // Vehicle Number Enter key
    document
    .getElementById("vehicleNumber")
    .addEventListener(
    "keypress",
    function(e){
        if(e.key==="Enter"){
            searchVehicle();
        }
    }
    );

    // Refresh Notifications Button
    const refreshBtn = document.getElementById("refreshNotificationsBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", refreshNotifications);
    }

    // Check login status
    if(localStorage.getItem("loggedIn")==="yes"){
        showApp();
    }

});


// =====================================
// LOGIN
// =====================================

function login(){

    let user = document.getElementById("username").value.trim();
    let pass = document.getElementById("password").value.trim();

    if(user==="admin" && pass==="12345"){
        localStorage.setItem("loggedIn", "yes");
        showApp();
    }
    else{
        document.getElementById("loginMessage").innerHTML = "Invalid Username or Password";
    }

}


// =====================================
// LOGOUT
// =====================================

function logout(){
    localStorage.removeItem("loggedIn");
    location.reload();
}


// =====================================
// SHOW APP
// =====================================

function showApp(){
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("appPage").style.display = "block";
    // Load notifications when app is shown
    loadNotifications();
}


// =====================================
// NOTIFICATIONS
// =====================================

// Load notifications on page load
async function loadNotifications() {
    const container = document.getElementById("notificationsList");
    if (!container) return;
    
    try {
        const { data, error } = await db
            .from("notifications")
            .select("*")
            .eq("user_id", CURRENT_USER_ID)
            .order("created_at", { ascending: false })
            .limit(50);
        
        if (error) {
            container.innerHTML = `
                <div class="no-notifications">
                    <div class="icon">❌</div>
                    <div>Error loading notifications</div>
                </div>
            `;
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <div class="icon">📭</div>
                    <div>No notifications yet</div>
                </div>
            `;
            return;
        }
        
        renderNotifications(data, container);
        
    } catch (error) {
        container.innerHTML = `
            <div class="no-notifications">
                <div class="icon">❌</div>
                <div>Failed to load notifications</div>
            </div>
        `;
    }
}

// Render notifications
function renderNotifications(notifications, container) {
    let html = "";
    let unreadCount = 0;
    
    notifications.forEach(notification => {
        const isUnread = !notification.is_read;
        if (isUnread) unreadCount++;
        
        const icon = getNotificationIcon(notification.type);
        const time = formatTime(notification.created_at);
        
        html += `
            <div class="notification-item ${isUnread ? 'unread' : 'read'} notification-type-${notification.type}" 
                 data-id="${notification.id}"
                 onclick="markAsRead('${notification.id}')">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <div class="title">${notification.title || 'Notification'}</div>
                    <div class="message">${notification.message || ''}</div>
                    <div class="time">${time}</div>
                    ${isUnread ? '<button class="mark-read-btn" onclick="event.stopPropagation(); markAsRead(\'' + notification.id + '\')">Mark as read</button>' : ''}
                </div>
            </div>
        `;
    });
    
    updateNotificationBadge(unreadCount);
    container.innerHTML = html;
}

// Get icon based on notification type
function getNotificationIcon(type) {
    const icons = {
        'added': '➕',
        'updated': '✏️',
        'sold': '💰',
        'moved_to_sales': '📦',
        'default': '📢'
    };
    return icons[type] || icons.default;
}

// Format time
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return mins + 'm ago';
    }
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return hours + 'h ago';
    }
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return days + 'd ago';
    }
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        const { error } = await db
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId);
        
        if (error) {
            console.error("Error marking as read:", error);
            return;
        }
        loadNotifications();
    } catch (error) {
        console.error("Error:", error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const header = document.querySelector('.notifications-title');
    if (!header) return;
    
    if (count > 0) {
        header.innerHTML = `📢 Notifications <span class="notification-badge">${count}</span>`;
    } else {
        header.innerHTML = `📢 Notifications`;
    }
}

// Refresh notifications
function refreshNotifications() {
    const container = document.getElementById("notificationsList");
    if (container) {
        container.innerHTML = `<div class="loading-notifications">Loading notifications...</div>`;
    }
    loadNotifications();
}


// =====================================
// SEARCH VEHICLE
// =====================================


// =====================================
// SEARCH VEHICLE (UPDATED - Shows error under textbox)
// =====================================

async function searchVehicle(){

    let input = document.getElementById("vehicleNumber").value.trim().toUpperCase();
    
    // Clear previous error message
    clearErrorMessage();

    if(input===""){
        showErrorMessage("Please enter a vehicle number");
        return;
    }

    loading("Searching...");
    document.getElementById("result").innerHTML = "";

    // EXACT SEARCH
    let {data,error} = await db
        .from("vehicles")
        .select("*")
        .eq("vehicle_number", input);

    let vehicles = data || [];

    // SEARCH WITHOUT LETTERS / DASH
    if(vehicles.length === 0){
        let clean = input.replace(/[^A-Z0-9]/g, "");
        let all = await db.from("vehicles").select("*");
        vehicles = (all.data || []).filter(v => {
            let dbNumber = String(v.vehicle_number)
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
            return dbNumber.includes(clean);
        });
    }

    loading("");

    if(vehicles.length === 0){
        document.getElementById("result").innerHTML = `
            <div class="not-found">Vehicle Not Found</div>
        `;
        return;
    }

    if(vehicles.length > 1){
        showVehicleSelector(vehicles);
        return;
    }

    loadVehicleDetails(vehicles[0]);
}

// =====================================
// SHOW ERROR MESSAGE UNDER TEXTBOX
// =====================================

function showErrorMessage(message) {
    // Remove existing error message if any
    clearErrorMessage();
    
    // Create error message element
    const errorDiv = document.createElement("div");
    errorDiv.id = "vehicleNumberError";
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    
    // Insert after the vehicle number input
    const vehicleInput = document.getElementById("vehicleNumber");
    vehicleInput.parentNode.insertBefore(errorDiv, vehicleInput.nextSibling);
    
    // Add red border to input
    vehicleInput.classList.add("input-error");
}

// =====================================
// CLEAR ERROR MESSAGE
// =====================================

function clearErrorMessage() {
    const errorElement = document.getElementById("vehicleNumberError");
    if (errorElement) {
        errorElement.remove();
    }
    const vehicleInput = document.getElementById("vehicleNumber");
    vehicleInput.classList.remove("input-error");
}


// =====================================
// MULTIPLE VEHICLES
// =====================================

function showVehicleSelector(list){
    let html = `
        <div class="vehicle-card">
            <div class="vehicle-header">Select Vehicle</div>
    `;

    list.forEach((v,index) => {
        html += `
            <div class="row" style="cursor:pointer" onclick="loadVehicleDetailsById('${v.id}')">
                <div class="label">${index+1}. ${v.vehicle_number}</div>
                <div class="value">${v.manufacture_year || ""} ${v.fuel_type || ""}</div>
            </div>
        `;
    });

    html += `</div>`;
    document.getElementById("result").innerHTML = html;
}

window.loadVehicleDetailsById = loadVehicleDetailsById;


// =====================================
// LOAD SELECTED VEHICLE
// =====================================

async function loadVehicleDetailsById(id){
    let {data,error} = await db
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

    if(error){
        console.log(error);
        return;
    }
    loadVehicleDetails(data);
}


// =====================================
// LOAD DETAILS (UPDATED - Fixed inspection items table name)
// =====================================

async function loadVehicleDetails(data){

    loading("Loading details...");

    // ===============================
    // IMAGES
    // ===============================

    let imagesHTML = "";

    let images = await db
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", data.id)
        .order("display_order", { ascending: true });

    if(images.data && images.data.length > 0){
        imagesHTML = `
            <div class="section-title">Vehicle Images</div>
            <div class="images">
                ${images.data.map(img => `
                    <img class="vehicle-thumb" src="${img.image_url}" onclick="openImage('${img.image_url}')">
                `).join("")}
            </div>
        `;
    }

    // ===============================
    // OPTIONS
    // ===============================

    let optionsHTML = "";

    let optionIDs = await db
        .from("vehicle_options")
        .select("option_id")
        .eq("vehicle_id", data.id);

    if(optionIDs.data && optionIDs.data.length){
        let ids = optionIDs.data.map(x => x.option_id);
        let options = await db
            .from("vehicle_options_master")
            .select("option_name,option_type")
            .in("id", ids);

        if(options.data){
            optionsHTML = options.data.map(o => `
                <div class="option-item">✔ ${o.option_name}</div>
            `).join("");
        }
    }

    // ===============================
    // INSPECTION ITEMS (FIXED - Using correct table name)
    // ===============================

    let inspectionHTML = "";

    try {
        // First, get the inspection items for this vehicle
        let inspection = await db
            .from("vehicle_inspection_items")
            .select("inspection_item_id")
            .eq("vehicle_id", data.id);

        console.log("Inspection data for vehicle:", data.id, inspection);

        if(inspection.data && inspection.data.length > 0){
            let ids = inspection.data.map(x => x.inspection_item_id);
            console.log("Inspection item IDs:", ids);
            
            // FIXED: Using "inspection_items" instead of "inspection_items_master"
            let items = await db
                .from("inspection_items")
                .select("id, name")
                .in("id", ids);

            console.log("Inspection items details:", items);

            if(items.data && items.data.length > 0){
                // Display inspection items with better styling
                inspectionHTML = `
                    <div class="inspection-items-grid">
                        ${items.data.map(i => `
                            <div class="inspection-item">
                                <span class="inspection-check">✅</span>
                                <span class="inspection-name">${i.name}</span>
                            </div>
                        `).join("")}
                    </div>
                    <div style="padding: 0 15px 15px 15px; font-size: 13px; color: #666;">
                        Total: ${items.data.length} inspection items
                    </div>
                `;
            } else {
                inspectionHTML = `
                    <div style="padding: 15px; color: #999;">
                        ⚠️ No inspection items found in the master table
                    </div>
                `;
            }
        } else {
            inspectionHTML = `
                <div style="padding: 15px; color: #999;">
                    📋 No inspection items assigned to this vehicle
                </div>
            `;
        }
    } catch (error) {
        console.error("Error fetching inspection items:", error);
        inspectionHTML = `
            <div style="padding: 15px; color: #e74c3c;">
                ❌ Error loading inspection items: ${error.message}
            </div>
        `;
    }

    loading("");

    // ===============================
    // DISPLAY
    // ===============================

    document.getElementById("result").innerHTML = `
        <div class="vehicle-card">
            <div class="vehicle-header">${data.vehicle_number}</div>
            ${imagesHTML}
            <div class="section-title">Vehicle Details</div>
            ${row("Brand ID",data.brand_id)}
            ${row("Model ID",data.model_id)}
            ${row("Vehicle Grade",data.vehicle_grade)}
            ${row("Manufacture Year",data.manufacture_year)}
            ${row("Registered Year",data.registered_year)}
            ${row("Body Type",data.body_type)}
            ${row("Fuel",data.fuel_type)}
            ${row("Transmission",data.transmission)}
            ${row("Engine",data.engine_capacity+" cc")}
            ${row("Colour",data.exterior_color)}
            ${row("Mileage",Number(data.mileage).toLocaleString()+" km")}
            ${row("Selling Price","Rs. "+Number(data.selling_amount).toLocaleString())}
            ${row("Status",data.status)}
            <div class="section-title">Vehicle Options</div>
            <div class="options">${optionsHTML || "No Options"}</div>
            <div class="section-title">Inspection</div>
            ${row("Battery Number",data.battery_number)}
            ${row("Fuel Pass",data.fuel_pass)}
            ${row("Document",data.document_with)}
            ${row("Ownership",data.ownership)}
            ${row("Inspection Note",data.special_inspection_note)}
            <div class="section-title">Inspection Items</div>
            <div class="inspection-container">${inspectionHTML}</div>
            <div class="section-title">Notes</div>
            ${row("Tag Notes",data.tag_notes)}
        </div>
    `;
}


// =====================================
// IMAGE FULL SCREEN
// =====================================

function openImage(url){
    let win = window.open("");
    win.document.write(`
        <html>
            <head>
                <title>Vehicle Image</title>
                <style>
                    body{
                        margin:0;
                        background:black;
                        display:flex;
                        justify-content:center;
                        align-items:center;
                        height:100vh;
                    }
                    img{
                        max-width:100%;
                        max-height:100vh;
                        object-fit:contain;
                    }
                </style>
            </head>
            <body>
                <img src="${url}">
            </body>
        </html>
    `);
}


// =====================================
// ROW
// =====================================

function row(title,value){
    return `
        <div class="row">
            <div class="label">${title}</div>
            <div class="value">${value ?? "-"}</div>
        </div>
    `;
}


// =====================================
// LOADING
// =====================================

function loading(text){
    document.getElementById("loading").innerHTML = text;
}
