import pandas as pd
import secrets
import string
from django.contrib.auth.models import User

# Step 1: Read the Excel File
file_path = r"C:\Users\HardikBhardwaj\Documents\IHFPL_CREDITTEAM_DETAILS_NOV24.xlsx"

df = pd.read_excel(file_path)

# Ensure the 'EmployeeID' column exists
if 'Emp ID' not in df.columns:
    raise ValueError("The Excel file must contain an 'EmployeeID' column.")

# Step 2: Generate Alphanumeric Passwords
def generate_password(length=12):
    alphabet = string.ascii_letters + string.digits  # Alphanumeric only
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Step 3: Create Superusers and Store Passwords
passwords = []
for employee_id in df['Emp ID']:
    username = str(employee_id)  # Ensure it's a string
    password = generate_password()
    passwords.append(password)
    
    # Create the superuser
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, password=password)
        print(f"Superuser created: {username}")
    else:
        print(f"Superuser {username} already exists.")

# Step 4: Add Passwords to Excel and Save
df['GeneratedPassword'] = passwords
output_file = 'updated_file_with_passwords.xlsx'
df.to_excel(output_file, index=False)

print(f"Updated file saved to {output_file}")
