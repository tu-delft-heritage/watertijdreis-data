import json
import pandas as pd

def process_json_data(json_path):
    # Read the JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    print(f"Successfully read JSON file: {json_path}")

    # Extract data into a list of dictionaries
    data_list = []
    for item in json_data.get('items', []):
        label = item.get('label', {}).get('none', [None])[0]
        if label: # Check if label exists
            metadata = item.get('metadata', [])
            # Use dictionary comprehension to extract metadata key-value pairs
            row_data = {
                meta.get('label', {}).get('en', [None])[0]: meta.get('value', {}).get('en', [None])[0]
                for meta in metadata
                if meta.get('label', {}).get('en', [None])[0] # Ensure metadata label exists
            }
            # Add the original label as a new column
            row_data['map_label'] = label.strip()
            data_list.append(row_data)

    # Create DataFrame from the list of dictionaries
    # Pandas will automatically create a default integer index
    df = pd.DataFrame(data_list)

    # Filter out rows where 'map_label' starts with '0'
    if 'map_label' in df.columns:
        df = df[~df['map_label'].astype(str).str.startswith('0')]
        df.reset_index(drop=True, inplace=True)

    # Optional: Reorder columns to have 'map_label' first
    if 'map_label' in df.columns:
        cols = ['map_label'] + [col for col in df.columns if col != 'map_label']
        df = df[cols]

    return df

def process_productinfo_data(productinfo_path):
    # Read the productinfo file
    productinfo_data = pd.read_excel(productinfo_path, engine="odf")
    print(f"Successfully read ODS file: {productinfo_path}")

    # filter for editie = "EERSTE"
    productinfo_data = productinfo_data[productinfo_data["editie"] == "EERSTE"]
    # redo numbering of index
    productinfo_data.reset_index(drop=True, inplace=True)
    #drop first row
    productinfo_data = productinfo_data.drop(index=0)
    #redo numbering of index
    productinfo_data.reset_index(drop=True, inplace=True)
    #drop columns not starting with "datum__" or titel
    productinfo_data = productinfo_data.loc[:, productinfo_data.columns.str.startswith("datum__") | productinfo_data.columns.str.startswith("titel")]
    
    return productinfo_data

JSON_PATH = r"content\iiif-manifests\01-1874-389916.json"
PRODUCTINFO_PATH = r"content\productinfo_klassed.ods"

json_df = process_json_data(JSON_PATH)
print("\nJSON DataFrame Head:")
print(json_df.head())
#print number of rows
print("\nNumber of rows in JSON DataFrame:")
print(len(json_df))

productinfo_df = process_productinfo_data(PRODUCTINFO_PATH)
print("\nProductinfo DataFrame Head:")
print(productinfo_df.head())
#print number of rows
print("\nNumber of rows in Productinfo DataFrame:")
print(len(productinfo_df))

#combine the two dataframes on the index
combined_df = pd.concat([json_df, productinfo_df], axis=1)
# drop datum__uitgave and datum__verwerking columns
combined_df = combined_df.drop(columns=["datum__uitgave"])
#print full dataframe
print("\nCombined DataFrame:")
print(combined_df.head(200))

# export to odf
combined_df.to_excel(r"content\combined_test.ods", engine="odf", index=False)
