const XLSX = require('xlsx');
const workbook = XLSX.readFile('Cafe_Dishes_Template.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
const updatedData = data.map(row => ({
  'Dish Name': row['Dish Name'] || row['dishName'],
  'Portions': row['Portions'] || row['portions'],
  'Wastage %': row['Wastage %'] || row['wastagePercent'],
  'Ingredient Name': row['Ingredient Name'] || row['ingredientName'],
  'Unit': row['Unit'] || row['unit'],
  'Quantity': row['Quantity'] || row['qty'],
  'Grams/Ml': row['Grams/Ml'] || row['gramsMl'],
  'UOM': row['UOM'] || row['uom'],
  'Is Base': row['Is Base'] !== undefined ? row['Is Base'] : row['isBase']
}));
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(updatedData), 'Sheet1');
XLSX.writeFile(newWb, 'Cafe_Dishes_Template.xlsx');
console.log('SUCCESS: Headers updated and file saved successfully!');
