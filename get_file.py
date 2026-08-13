import pandas as pd
import openpyxl

# Load base recipe.xlsx and extract uncolored sheets
excel = pd.ExcelFile('base recipe.xlsx')
wb = openpyxl.load_workbook('base recipe.xlsx', data_only=True)
uncolored = [
    name for name in wb.sheetnames 
    if name != 'Master Ingredient List' 
    and not (wb[name].sheet_properties.tabColor and wb[name].sheet_properties.tabColor.rgb)
]

main_rows = []
for name in uncolored:
    df = pd.read_excel(excel, sheet_name=name, header=2)
    cols = [str(c).strip() for c in df.columns]
    if len(cols) < 7: continue
    desc_col, qty_col, unit_col, grams_col, uom_col = cols[2], cols[3], cols[4], cols[5], cols[6]
    
    for _, row in df.iterrows():
        ing_name = row.get(desc_col)
        if pd.isna(ing_name) or str(ing_name).strip() == '' or 'ingredient' in str(ing_name).lower():
            continue
        try:
            qty_val = float(row.get(qty_col, 1))
        except:
            qty_val = 1.0
        try:
            grams_val = float(row.get(grams_col, qty_val))
        except:
            grams_val = qty_val

        main_rows.append({
            'dishName': name.strip(),
            'portions': 1,
            'wastagePercent': 10,
            'ingredientName': str(ing_name).strip(),
            'unit': str(row.get(unit_col, 'GRM')).strip().upper(),
            'qty': qty_val,
            'gramsMl': grams_val,
            'uom': str(row.get(uom_col, 'GRM')).strip().upper(),
            'isBase': False
        })

df_main = pd.DataFrame(main_rows)
df_main.to_excel('Cafe_Dishes_Template.xlsx', index=False)
print("SUCCESS: Cafe_Dishes_Template.xlsx created successfully in your folder!")