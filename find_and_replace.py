import os
import json

def replace_labels_in_json(data, label_mapping):
    """
    Recursively traverses JSON data (dict or list) and replaces values
    based on the provided label_mapping.
    """
    if isinstance(data, dict):
        return {key: replace_labels_in_json(value, label_mapping) for key, value in data.items()}
    elif isinstance(data, list):
        return [replace_labels_in_json(item, label_mapping) for item in data]
    elif isinstance(data, str) and data in label_mapping:
        # Replace the string if it matches a key in the mapping
        return label_mapping[data]
    else:
        # Return other data types (int, float, bool, None) or non-matching strings as they are
        return data

def replace_labels_in_json_parts(data, label_mapping):
    """
    Recursively traverses JSON data (dict or list) and replaces parts of string values
    based on the provided label_mapping, splitting strings by periods.
    """
    if isinstance(data, dict):
        # Recursively process dictionary values
        return {key: replace_labels_in_json_parts(value, label_mapping) for key, value in data.items()}
    elif isinstance(data, list):
        # Recursively process list items
        return [replace_labels_in_json_parts(item, label_mapping) for item in data]
    elif isinstance(data, str):
        # Handle string values
        if '.' in data:
            if data.startswith('Waterstaatskaart van Nederland'):
                return data
            parts = data.split('.')
            replaced_parts = [label_mapping.get(part, part) for part in parts]
            return '.'.join(replaced_parts)
        else:
            # Return string as is if no dots are found
            return data
    else:
        # Return other data types (int, float, bool, None) as they are
        return data

def process_json_files_in_directory(directory_path, label_mapping):
    """
    Iterates through all .json files in a directory and applies label replacement.
    """
    if not os.path.isdir(directory_path):
        print(f"Error: Directory not found at {directory_path}")
        return

    print(f"Processing JSON files in directory: {directory_path}")

    for filename in os.listdir(directory_path):
        filepath = os.path.join(directory_path, filename)

        try:
            # Read the JSON file
            with open(filepath, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            # Apply the label replacement
            modified_data_1 = replace_labels_in_json(json_data, label_mapping)
            modified_data = replace_labels_in_json_parts(modified_data_1, name_replacements)

            # Write the modified data back to a new JSON file
            output_filepath = os.path.join(directory_path, f"modified_{filename}")
            with open(output_filepath, 'w', encoding='utf-8') as f:
                json.dump(modified_data, f, ensure_ascii=False, indent=4)

            print(f"Successfully processed {filename}")

        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from {filename}. Skipping.")
        except Exception as e:
            print(f"An error occurred while processing {filename}: {e}")

# --- Configuration ---

# Specify the directory containing your JSON files
json_directory = 'content/iiif-manifests' 

# Define your label mapping here
# Keys are the labels to be replaced, values are the replacement labels
label_replacements = {
    'bw' : 'bewerkt',
    'vk' : 'verkend',
    'hz' : 'herzien',
    'bij' : 'bijgewerkt',
    'gbij' : 'bijgewerkt',
    'ui' : 'uitgave',
    'ba' : 'basis',
    # 'old_label': 'new_label',
}

name_replacements = {
    'WVE':'watervoorzieningseenheden',
    'HWP': 'hydrologische waarnemingspunten',
    'B':'back',
    'dup' : 'duplicate',
    'L' : 'left',
    'R' : 'right',
}


if __name__ == "__main__":
    process_json_files_in_directory(json_directory, label_replacements)
    print("\nProcessing complete.")