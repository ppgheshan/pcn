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
// LOGIN CREDENTIALS (Update these when you change login)
// =====================================

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "12345";

// Version number - increment this when you change credentials
const LOGIN_VERSION = "1.0";


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener(
"DOMContentLoaded",
()=>{

document
.getElementById("loginBtn")
.addEventListener(
"click",
login
);

document
.getElementById("searchBtn")
.addEventListener(
"click",
searchVehicle
);

document
.getElementById("logoutBtn")
.addEventListener(
"click",
logout
);

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

// Check if user is already logged in
checkLoginStatus();

});


// =====================================
// CHECK LOGIN STATUS
// =====================================

function checkLoginStatus() {
    const loggedIn = localStorage.getItem("loggedIn");
    const savedVersion = localStorage.getItem("loginVersion");
    const currentVersion = LOGIN_VERSION;

    // If logged in and version matches, show app directly
    if (loggedIn === "yes" && savedVersion === currentVersion) {
        showApp();
    } else {
        // Clear any invalid login data
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("loginVersion");
        showLogin();
    }
}


// =====================================
// LOGIN
// =====================================

function login(){

let user =
document.getElementById("username")
.value
.trim();

let pass =
document.getElementById("password")
.value
.trim();

if(
user === VALID_USERNAME &&
pass === VALID_PASSWORD
){

// Save login status with version
localStorage.setItem(
"loggedIn",
"yes"
);
localStorage.setItem(
"loginVersion",
LOGIN_VERSION
);

showApp();

}
else{

document.getElementById("loginMessage")
.innerHTML =
"Invalid Username or Password";

}

}


// =====================================
// LOGOUT
// =====================================

function logout(){

// Clear all login data
localStorage.removeItem("loggedIn");
localStorage.removeItem("loginVersion");

// Reload to show login page
location.reload();

}


// =====================================
// SHOW APP
// =====================================

function showApp(){

document.getElementById("loginPage")
.style.display="none";

document.getElementById("appPage")
.style.display="block";

}


// =====================================
// SHOW LOGIN
// =====================================

function showLogin(){

document.getElementById("loginPage")
.style.display="flex";

document.getElementById("appPage")
.style.display="none";

// Clear any error messages
document.getElementById("loginMessage").innerHTML = "";

// Clear input fields
document.getElementById("username").value = "";
document.getElementById("password").value = "";

}


// =====================================
// SEARCH VEHICLE
// =====================================

async function searchVehicle(){

let input =
document
.getElementById("vehicleNumber")
.value
.trim()
.toUpperCase();

if(input===""){

alert(
"Enter Vehicle Number"
);

return;

}

loading("Searching...");

document.getElementById("result")
.innerHTML="";

// EXACT SEARCH

let {data,error}=await db

.from("vehicles")

.select("*")

.eq(
"vehicle_number",
input
);

let vehicles=data || [];

// SEARCH WITHOUT LETTERS / DASH

if(vehicles.length===0){

let clean =
input.replace(
/[^A-Z0-9]/g,
""
);

let all =
await db

.from("vehicles")

.select("*");

vehicles =
(all.data || [])
.filter(v=>{

let dbNumber =
String(v.vehicle_number)
.toUpperCase()
.replace(
/[^A-Z0-9]/g,
""
);

return dbNumber.includes(clean);

});

}

loading("");

if(vehicles.length===0){

document.getElementById("result")
.innerHTML=

`
<div class="not-found">
Vehicle Not Found
</div>
`;

return;

}

if(vehicles.length>1){

showVehicleSelector(
vehicles
);

return;

}

loadVehicleDetails(
vehicles[0]
);

}

// =====================================
// MULTIPLE VEHICLES
// =====================================

function showVehicleSelector(list){

let html=

`
<div class="vehicle-card">

<div class="vehicle-header">
Select Vehicle
</div>

`;

list.forEach(
(v,index)=>{

html+=`

<div class="row"
style="cursor:pointer"
onclick="loadVehicleDetailsById('${v.id}')">

<div class="label">

${index+1}. ${v.vehicle_number}

</div>

<div class="value">

${v.manufacture_year || ""}

${v.fuel_type || ""}

</div>

</div>

`;

});

html+=`</div>`;

document.getElementById("result")
.innerHTML=html;

}

window.loadVehicleDetailsById =
loadVehicleDetailsById;


// =====================================
// LOAD SELECTED VEHICLE
// =====================================

async function loadVehicleDetailsById(id){

let {data,error}=await db

.from("vehicles")

.select("*")

.eq(
"id",
id
)

.single();

if(error){

console.log(error);

return;

}

loadVehicleDetails(data);

}


// =====================================
// LOAD DETAILS
// =====================================

async function loadVehicleDetails(data){

loading(
"Loading details..."
);

// ===============================
// IMAGES
// ===============================

let imagesHTML="";

let images =
await db

.from("vehicle_images")

.select("*")

.eq(
"vehicle_id",
data.id
)

.order(
"display_order",
{
ascending:true
}
);

if(
images.data &&
images.data.length>0
){

imagesHTML=

`

<div class="section-title">
Vehicle Images
</div>

<div class="images">

${
images.data.map(img=>

`

<img

class="vehicle-thumb"

src="${img.image_url}"

onclick="openImage('${img.image_url}')"

>

`
).join("")
}

</div>

`;

}


// ===============================
// OPTIONS
// ===============================

let optionsHTML="";

let optionIDs =
await db

.from("vehicle_options")

.select("option_id")

.eq(
"vehicle_id",
data.id
);

if(
optionIDs.data &&
optionIDs.data.length
){

let ids =
optionIDs.data.map(
x=>x.option_id
);

let options =
await db

.from("vehicle_options_master")

.select(
"option_name,option_type"
)

.in(
"id",
ids
);

if(options.data){

optionsHTML =
options.data.map(o=>

`

<div class="option-item">

✔ ${o.option_name}

</div>

`
).join("");

}

}


// ===============================
// INSPECTION ITEMS
// ===============================

let inspectionHTML="";

let inspection =
await db

.from("vehicle_inspection_items")

.select(
"inspection_item_id"
)

.eq(
"vehicle_id",
data.id
);

if(
inspection.data &&
inspection.data.length
){

let ids =
inspection.data.map(
x=>x.inspection_item_id
);

let items =
await db

.from("inspection_items_master")

.select("name")

.in(
"id",
ids
);

if(items.data){

inspectionHTML =
items.data.map(i=>

`

<div class="option-item">

✔ ${i.name}

</div>

`
).join("");

}

}


loading("");

// ===============================
// DISPLAY
// ===============================

document.getElementById("result")
.innerHTML=

`

<div class="vehicle-card">

<div class="vehicle-header">

${data.vehicle_number}

</div>

${imagesHTML}

<div class="section-title">
Vehicle Details
</div>

${row("Brand ID",data.brand_id)}

${row("Model ID",data.model_id)}

${row("Manufacture Year",data.manufacture_year)}

${row("Registered Year",data.registered_year)}

${row("Body Type",data.body_type)}

${row("Fuel",data.fuel_type)}

${row("Transmission",data.transmission)}

${row("Engine",data.engine_capacity+" cc")}

${row("Colour",data.exterior_color)}

${row("Mileage",
Number(data.mileage).toLocaleString()+" km")}

${row("Selling Price",
"Rs. "+
Number(data.selling_amount).toLocaleString())}

${row("Status",data.status)}

<div class="section-title">
Vehicle Options
</div>

<div class="options">

${optionsHTML || "No Options"}

</div>

<div class="section-title">
Inspection
</div>

${row("Battery Number",data.battery_number)}

${row("Fuel Pass",data.fuel_pass)}

${row("Document",data.document_with)}

${row("Ownership",data.ownership)}

${row("Inspection Note",data.special_inspection_note)}

<div class="section-title">
Inspection Items
</div>

<div class="options">

${inspectionHTML || "No Inspection Items"}

</div>

<div class="section-title">
Notes
</div>

${row("Tag Notes",data.tag_notes)}

</div>

`;

}


// =====================================
// IMAGE FULL SCREEN
// =====================================

function openImage(url){

let win =
window.open("");

win.document.write(`

<html>

<head>

<title>
Vehicle Image
</title>

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

<div class="label">

${title}

</div>

<div class="value">

${value ?? "-"}

</div>

</div>

`;

}


// =====================================
// LOADING
// =====================================

function loading(text){

document.getElementById("loading")
.innerHTML=text;

}
