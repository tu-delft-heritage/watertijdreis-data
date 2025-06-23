from collections import Counter

with open('./content/lonely_number.txt', 'r') as file:
    lonely_numbers = file.read().splitlines()

lonely_numbers_only = [lonely_number.split('.')[0] for lonely_number in lonely_numbers]

# print numbers that only occur once
lonely_numbers_count = Counter(lonely_numbers_only)
lonely_numbers_unique = [number for number, count in lonely_numbers_count.items() if count == 1]
print(lonely_numbers_unique)