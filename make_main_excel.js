const XLSX = require('xlsx');

const workbook = XLSX.readFile('base recipe.xlsx');
const baseKeywords = ['yield', 'base', 'batter', 'sauce', 'chutney', 'puree', 'gravy', 'oil', 'dressing', 'seasoning'];
let rows = [];

workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'Master Ingredient List') return;
    const sheetLower = sheetName.toLowerCase();
    if (baseKeywords.some(k => sheetLower.includes(k))) return;

    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    if (data.length <= 2) return;

    for (let i = 3; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[2]) continue;
        const ingName = String(row[2]).trim();
        if (!ingName || ingName.toLowerCase() === 'nan' || ingName.toLowerCase().includes('ingredient')) continue;

        rows.push({
            dishName: sheetName.trim(),
            portions: 1,
            wastagePercent: 10,
            ingredientName: ingName,
            qty: row[3] !== undefined ? parseFloat(row[3]) || 1.0 : 1.0,
            unit: row[4] !== undefined ? String(row[4]).trim().toUpperCase() : 'GRM',
            gramsMl: row[5] !== undefined ? parseFloat(row[5]) || 1.0 : 1.0,
            uom: row[6] !== undefined ? String(row[6]).trim().toUpperCase() : 'GRM',
            isBase: false
        });
    }
});

const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(rows), "Main Recipes");
XLSX.writeFile(newWb, 'Consolidated_Main_Recipes_Template.xlsx');
console.log("Consolidated_Main_Recipes_Template.xlsx generated successfully via Node!");