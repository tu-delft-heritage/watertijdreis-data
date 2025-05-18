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
        if label:  # Check if label exists
            metadata = item.get('metadata', [])
            # Use dictionary comprehension to extract metadata key-value pairs
            row_data = {
                meta.get('label', {}).get('en', [None])[0]: meta.get('value', {}).get('en', [None])[0]
                for meta in metadata
                if meta.get('label', {}).get('en', [None])[0]  # Ensure metadata label exists
            }
            # Add the original label as a new column
            row_data['map_label'] = label.strip()
            data_list.append(row_data)

    # Create DataFrame from the list of dictionaries
    # Pandas will automatically create a default integer index
    df = pd.DataFrame(data_list)

    #isolate map_label column
    df = df['map_label']

    #drop rows where map_label starts with 0
    df = df[~df.astype(str).str.startswith('0')]

    return df


# -------------------------------------------------------------------------
# This function is a mess, but it works. Just don't try to understand it.'
# -------------------------------------------------------------------------
def generate_mapping():

    PRODUCTINFO_PATH = r"content/productinfo_klassed.ods"

    # Read the productinfo file
    productinfo_data = pd.read_excel(PRODUCTINFO_PATH, engine="odf")

    # isolate titel column
    productinfo_data = productinfo_data['titel']

    mapping = {}

    #make list
    productinfo = productinfo_data.tolist()

    #make capitals
    productinfo = [s.upper() for s in productinfo]

    # replace 47 / 53 SLUIS with 53 SLUIS
    productinfo = [s.replace('47 / 53 SLUIS', '53 SLUIS') for s in productinfo]

    # if "'S-" in string, replace with "'S*"
    productinfo = [s.replace("'S-", "'S ") for s in productinfo]

    productinfo = [s.rsplit('-', 1)[0] for s in productinfo]
    productinfo = [s.rsplit(' – ', 1)[0] for s in productinfo]

    # replace 23 NIEUW with 23 NIEUW-SCHOONEBEEK
    productinfo = [s.replace('23 NIEUW', '23 NIEUW-SCHOONEBEEK') for s in productinfo]

    # replace HELDER with DEN HELDER
    productinfo = [s.replace('HELDER', 'DEN HELDER') for s in productinfo]

    for row in productinfo:
        parts= row.split(" ")
        if len(parts) < 2:
            continue
        num, name = parts[0], parts[1:]
        if num[0] not in '0123456789':
            continue

        if len(name) > 1:
            name = ' '.join(name)
        else:
            name = name[0]

        # remove parts between brackets
        if '(' in name:
            name = name.split('(')[0]

        # remove 'WEST' and 'OOST'
        if 'WEST' in name:
            name = name.replace(' WEST', '')
        if 'OOST' in name:
            name = name.replace(' OOST', '')

        # remove trailing numbers
        if len(name.split(" ")) > 1:
            bits = name.split(" ")
            if bits[-1] in '0123456789':
                name =  bits[:-1]
                if len(name) > 1:
                    name = ' '.join(name)
                else:
                    name = name[0]


        if num not in mapping:
            mapping[num] = name

    #convert keys in mapping to integers
    mapping = {int(key): value for key, value in mapping.items()}

    #sort mapping by key
    mapping = dict(sorted(mapping.items()))

    return mapping


JSON_PATH = r"content/iiif-manifests/09-1874-456827.json"
json_df = process_json_data(JSON_PATH)

mapping = generate_mapping()
for key, value in mapping.items():
    print(f"{key}: {value}")
print(f"detected {len(mapping)} labels")

#add a column to jason_df called 'name'
json_df = json_df.to_frame()
json_df['name'] = None

# fill the rows of name column with the value from the mapping where the key is the same as the string part before the first period
for key, value in mapping.items():
    json_df.loc[json_df['map_label'].str.startswith(str(key)), 'name'] = value

# export to odf
json_df.to_excel(r"content/labels.ods", engine="odf", index=False)
