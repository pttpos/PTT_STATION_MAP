// Event listener to open the filter offcanvas
document.querySelector('.btn[data-bs-toggle="modal"]').addEventListener('click', function () {
    var filterOffcanvas = new bootstrap.Offcanvas(document.getElementById('filterOffcanvas'));
    filterOffcanvas.show();
});

// Mapping object to associate data entries with specific images
const imageMapping = {
    "Amazon": "amazon.png",
    "7-Eleven": "7eleven.png",
    "Fleet card": "fleet.png",
    "KHQR": "KHQR.png",
    "Cash": "cash.png",
    "EV": "ev.png",
    "Onion": "onion.png",
    "ULG 95": "ULG95.png",
    "ULR 91": "ULR91.png",
    "HSD": "HSD.png",
    "promotion1": "opening1.jpg"
    // Add more mappings as needed
};

// Function to populate icon containers and province dropdown
function populateIconContainersAndDropdown(data) {
    const province = document.getElementById('province').value.toLowerCase() || '';

    populateIconContainer('product-icons', getUniqueItems(data, 'product', province), 'round');
    populateIconContainer('other-product-icons', getUniqueItems(data, 'other_product', province), 'custom');
    populateIconContainer('service-icons', getUniqueItems(data, 'service', province), 'custom');
    populateIconContainer('description-icons', getUniqueItems(data, 'description', province), 'round');
    populateIconContainer('promotion-icons', getUniqueItems(data, 'promotion', province), 'round');
    populateProvinceDropdown(data);
}

// Helper function to get unique items from data, filtered by province if provided
function getUniqueItems(data, key, province = '') {
    const items = new Set();
    data.forEach(station => {
        if ((!province || station.province.toLowerCase() === province) && station[key]) {
            station[key].forEach(item => {
                if (item.trim() !== "") { // Filter out empty items
                    items.add(item);
                }
            });
        }
    });
    return Array.from(items);
}

function populateIconContainer(containerId, items, shapeClass) {
    const container = document.getElementById(containerId);
    const province = document.getElementById('province').value.toLowerCase();
    container.innerHTML = ''; // Clear existing icons

    items.forEach(item => {
        const img = document.createElement('img');
        img.src = `./pictures/${imageMapping[item]}`; // Use the mapping object to get the image filename
        img.alt = item;
        img.classList.add('filter-icon', shapeClass); // Apply the shape class
        img.dataset.item = item;

        // Check if the item is available in the selected province
        const isAvailable = allMarkers.some(marker => {
            return (!province || marker.data.province.toLowerCase() === province) &&
                   marker.data[containerId.replace('-icons', '').replace('-', '_')] && // Adjusting key name to match data structure
                   marker.data[containerId.replace('-icons', '').replace('-', '_')].map(el => el.toLowerCase()).includes(item.toLowerCase());
        });

        if (!isAvailable && province) {
            img.classList.add('disabled'); // Add disabled class to grey out the icon
            img.style.pointerEvents = 'none'; // Prevent clicking on the icon
        } else {
            img.classList.remove('disabled'); // Ensure the item is enabled
            img.style.pointerEvents = 'auto'; // Ensure the item can be clicked
            img.addEventListener('click', toggleIconSelection);
        }

        container.appendChild(img);
    });
}

function populateProvinceDropdown(data) {
    const provinces = new Set();
    data.forEach(station => {
        provinces.add(station.province);
    });

    // Sort provinces alphabetically
    const sortedProvinces = Array.from(provinces).sort((a, b) => a.localeCompare(b));

    const provinceSelect = document.getElementById('province');
    sortedProvinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.text = province;
        provinceSelect.add(option);
    });

    // Add event listener to update titles when province is selected
    provinceSelect.addEventListener('change', () => {
        const selectedProvince = provinceSelect.value.toLowerCase();
        const titles = new Set();
        data.forEach(station => {
            if (station.province.toLowerCase() === selectedProvince) {
                titles.add(station.title);
            }
        });

        const titleSelect = document.getElementById('title');
        titleSelect.innerHTML = '<option value>All</option>'; // Clear existing titles
        titles.forEach(title => {
            const option = document.createElement('option');
            option.value = title;
            option.text = title;
            titleSelect.add(option);
        });

        // Repopulate icon containers based on selected province
        populateIconContainersAndDropdown(data);
    });
}

// Toggle icon selection
function toggleIconSelection(event) {
    const icon = event.target;
    icon.classList.toggle('selected');
}

// Apply filter function
function applyFilter() {
    const province = document.getElementById('province').value.toLowerCase();
    const title = document.getElementById('title').value.toLowerCase();
    const selectedProducts = getSelectedItems('product-icons').map(item => item.toLowerCase());
    const selectedOtherProducts = getSelectedItems('other-product-icons').map(item => item.toLowerCase());
    const selectedServices = getSelectedItems('service-icons').map(item => item.toLowerCase());
    const selectedDescriptions = getSelectedItems('description-icons').map(item => item.toLowerCase());
    const selectedPromotions = getSelectedItems('promotion-icons').map(item => item.toLowerCase());

    markers.clearLayers(); // Clear existing markers
    let filteredMarkers = []; // Array to hold filtered markers

    allMarkers.forEach(entry => {
        let match = true;

        if (province && entry.data.province.toLowerCase().indexOf(province) === -1) {
            match = false;
        }
        if (title && entry.data.title.toLowerCase().indexOf(title) === -1) {
            match = false;
        }
        if (selectedDescriptions.length && !selectedDescriptions.some(item => entry.data.description.map(desc => desc.toLowerCase()).includes(item))) {
            match = false;
        }
        if (selectedServices.length && !selectedServices.some(item => entry.data.service.map(serv => serv.toLowerCase()).includes(item))) {
            match = false;
        }
        if (selectedProducts.length && !selectedProducts.some(item => entry.data.product.map(prod => prod.toLowerCase()).includes(item))) {
            match = false;
        }
        const otherProducts = (entry.data.other_product || []).filter(op => op.trim() !== "").map(op => op.toLowerCase());
        if (selectedOtherProducts.length && !selectedOtherProducts.some(item => otherProducts.includes(item))) {
            match = false;
        }
        if (match) {
            markers.addLayer(entry.marker);
            filteredMarkers.push(entry.marker); // Add the filtered marker to the array
        }
    });

    map.addLayer(markers);

    if (filteredMarkers.length > 0) {
        const group = new L.featureGroup(filteredMarkers);
        const bounds = group.getBounds();
        map.flyToBounds(bounds, {
          animate: true,
          duration: 1 // Adjust the duration of the zoom animation here
        }); // Animate map to fit the bounds of the filtered markers
    }

    // Hide the offcanvas
    var filterOffcanvasElement = document.getElementById('filterOffcanvas');
    var filterOffcanvas = bootstrap.Offcanvas.getInstance(filterOffcanvasElement);
    filterOffcanvas.hide();
}

// Helper function to get selected items from an icon container
function getSelectedItems(containerId) {
    const container = document.getElementById(containerId);
    const selectedIcons = container.querySelectorAll('.filter-icon.selected');
    return Array.from(selectedIcons).map(icon => icon.dataset.item);
}

// Add event listener to form submit
document.getElementById('filterForm').addEventListener('submit', function(event) {
    event.preventDefault();
    applyFilter();
});
