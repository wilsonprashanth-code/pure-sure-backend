const XLSX = require('xlsx');
const workbook = XLSX.readFile('Cafe_Dishes_Template.xlsx');
console.log('SUCCESS! Loaded recipes template with ' + XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).length + ' rows.');
