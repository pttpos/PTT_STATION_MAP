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
    "ABA": "aba.png",
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
    populateIconContainer('product-icons', getUniqueItems(data, 'product'), 'round');
    populateIconContainer('other-product-icons', getUniqueItems(data, 'other_product'), 'custom');
    populateIconContainer('service-icons', getUniqueItems(data, 'service'), 'custom');
    populateIconContainer('description-icons', getUniqueItems(data, 'description'), 'round');
    populateIconContainer('promotion-icons', getUniqueItems(data, 'promotion'), 'round');
    populateProvinceDropdown(data);
}

// Helper function to get unique items from data
function getUniqueItems(data, key) {
    const items = new Set();
    data.forEach(station => {
        if (station[key]) {
            station[key].forEach(item => {
                if (item.trim() !== "") { // Filter out empty items
                    items.add(item);
                }
            });
        }
    });
    return Array.from(items);
}

// Helper function to populate an icon container
function populateIconContainer(containerId, items, shapeClass) {
    const container = document.getElementById(containerId);
    items.forEach(item => {
        const img = document.createElement('img');
        img.src = `./pictures/${imageMapping[item]}`; // Use the mapping object to get the image filename
        img.alt = item;
        img.classList.add('filter-icon', shapeClass); // Apply the shape class
        img.dataset.item = item;
        img.addEventListener('click', toggleIconSelection);
        container.appendChild(img);
    });
}

// Helper function to populate province dropdown
function populateProvinceDropdown(data) {
    const provinces = new Set();
    data.forEach(station => provinces.add(station.province));
    const provinceSelect = document.getElementById('province');
    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.text = province;
        provinceSelect.add(option);
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
    const selectedProducts = getSelectedItems('product-icons').map(item => item.toLowerCase());
    const selectedOtherProducts = getSelectedItems('other-product-icons').map(item => item.toLowerCase());
    const selectedServices = getSelectedItems('service-icons').map(item => item.toLowerCase());
    const selectedDescriptions = getSelectedItems('description-icons').map(item => item.toLowerCase());
    const selectedPromotions = getSelectedItems('promotion-icons').map(item => item.toLowerCase());

    markers.clearLayers(); // Clear existing markers

    allMarkers.forEach(entry => {
        let match = true;

        if (province && entry.data.province.toLowerCase().indexOf(province) === -1) {
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
        // Filter out empty strings in other_product
        const otherProducts = (entry.data.other_product || []).filter(op => op.trim() !== "").map(op => op.toLowerCase());
        if (selectedOtherProducts.length && !selectedOtherProducts.some(item => otherProducts.includes(item))) {
            match = false;
        }
        if (match) {
            markers.addLayer(entry.marker);
        }
    });

    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

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