// Base Recipe Grouping & Parser Patch
document.addEventListener('DOMContentLoaded', () => {
    console.log("Base Recipe Patch loaded successfully.");
});

// Overwrite global CSV parser to correctly group ingredients per master recipe
function parseBaseRecipesCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return;

    if (typeof baseRecipesStore === 'undefined') {
        window.baseRecipesStore = {};
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 4) continue;

        const rawRecipeName = cols[0];
        const batchYield = parseFloat(cols[1]) || 1;
        const unit = cols[2] || 'GRM';
        const ingredientName = cols[3];
        const qty = parseFloat(cols[4]) || 0;
        const ingredientUnit = cols[5] || 'GRM';
        const gramsMl = parseFloat(cols[6]) || qty;
        const uom = cols[7] || 'GRM';
        const vendor = cols[8] || 'FACTORY';

        if (!rawRecipeName || !ingredientName) continue;

        const storeKey = rawRecipeName.trim();

        if (!baseRecipesStore[storeKey]) {
            baseRecipesStore[storeKey] = {
                prepName: rawRecipeName.trim(),
                batchYield: batchYield,
                unit: unit,
                ingredients: []
            };
        }

        // Avoid duplicate ingredient pushes if re-parsed
        const exists = baseRecipesStore[storeKey].ingredients.some(ing => ing.ingredientName === ingredientName && ing.qty === qty);
        if (!exists) {
            baseRecipesStore[storeKey].ingredients.push({
                type: (vendor && vendor.toUpperCase() === 'PRE PREP') ? 'Base Prep' : 'Raw Material',
                ingredientName: ingredientName,
                qty: qty,
                unit: ingredientUnit,
                gramsMl: gramsMl,
                uom: uom,
                vendor: vendor,
                rate: 0,
                cost: 0
            });
        }
    }

    if (typeof renderSavedPrepList === 'function') renderSavedPrepList();
    if (typeof renderDashboardPreview === 'function') renderDashboardPreview();
}
