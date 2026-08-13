const XLSX = require('xlsx');

const workbook = XLSX.readFile('base recipe.xlsx');
const baseKeywords = ['yield', 'base', 'batter', 'sauce', 'chutney', 'puree', 'gravy', 'oil', 'dressing', 'seasoning'];

let mainRows = [];
let baseRows = [];

workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'Master Ingredient List') return;
    const sheetLower = sheetName.toLowerCase();
    const isBase = baseKeywords.some(k => sheetLower.includes(k));

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length <= 2) return;

    let batchYield = 1;
    if (isBase) {
        for (let r = 0; r < Math.min(3, data.length); r++) {
            const rowStr = JSON.stringify(data[r]);
            const match = rowStr.match(/(\d+(\.\d+)?)/g);
            if (match && rowStr.toLowerCase().includes('yield')) {
                batchYield = parseFloat(match[match.length - 1]);
            }
        }
    }

    for (let i = 3; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[2]) continue;
        const ingName = String(row[2]).trim();
        if (!ingName || ingName.toLowerCase() === 'nan' || ingName.toLowerCase().includes('ingredient')) continue;

        const qty = row[3] !== undefined ? parseFloat(row[3]) || 1.0 : 1.0;
        const unit = row[4] !== undefined ? String(row[4]).trim().toUpperCase() : 'GRM';
        const grams = row[5] !== undefined ? parseFloat(row[5]) || qty : qty;
        const uom = row[6] !== undefined ? String(row[6]).trim().toUpperCase() : unit;

        if (isBase) {
            baseRows.push({
                recipeName: sheetName.trim(),
                batchYield: batchYield,
                unit: sheetLower.includes('pcs') ? 'PCS' : 'GRM',
                ingredientName: ingName,
                qty: qty,
                unit: unit === 'NAN' || !unit ? 'GRM' : unit,
                gramsMl: grams,
                uom: uom === 'NAN' || !uom ? 'GRM' : uom
            });
        } else {
            mainRows.push({
                dishName: sheetName.trim(),
                portions: 1,
                wastagePercent: 10,
                ingredientName: ingName,
                qty: qty,
                unit: unit === 'NAN' || !unit ? 'GRM' : unit,
                gramsMl: grams,
                uom: uom === 'NAN' || !uom ? 'GRM' : uom,
                isBase: false
            });
        }
    }
});

const newWbMain = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWbMain, XLSX.utils.json_to_sheet(mainRows), "Main Recipes");
XLSX.writeFile(newWbMain, 'Consolidated_Main_Recipes_Template.xlsx');

const newWbBase = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWbBase, XLSX.utils.json_to_sheet(baseRows), "Base Recipes");
XLSX.writeFile(newWbBase, 'Consolidated_Base_Recipes_Template.xlsx');

console.log("Excel templates generated successfully via Node.js!");