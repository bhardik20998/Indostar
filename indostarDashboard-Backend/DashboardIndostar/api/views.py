from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from pymongo import MongoClient
import requests
import json
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings
from .functions import extract_lat_lon_from_pdf
import pandas as pd
from datetime import datetime
MONGO_URI = "mongodb://localhost:27017"  
MONGO_DB_NAME = "Property-Scorecard" 
Api_key = 'AIzaSyCW2KbJR_ECwHKYd9H_v_su1-MCakvfNcY' 


@csrf_exempt
def generate_nearby_places_map(latitude, longitude, selected_categories, categories, radius_5000, radius_3000, units, max_dist, api_key):
    def nearby_search(location, type_list, radius, Api_key):
        payload = {
            "includedTypes": type_list,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": location[0],
                        "longitude": location[1]
                    },
                    "radius": radius
                }
            }
        }

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": Api_key,
            "X-Goog-FieldMask": "places.displayName,places.location"
        }

        url = "https://places.googleapis.com/v1/places:searchNearby"
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print("Error:", response.status_code, response.text)
            return None

    def get_distance(origin, dest, units, api_key):
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        origins = f"{origin[0]},{origin[1]}"
        destinations = f"{dest['latitude']},{dest['longitude']}"
        params = {
            "origins": origins,
            "destinations": destinations,
            "units": units,
            "key": api_key
        }
        response = requests.get(url, params=params)
        data = response.json()
        if data['status'] == 'OK':
            distance_value = data['rows'][0]['elements'][0]['distance']['value']
            return distance_value
        else:
            return None

    def generate_map_url(center, markers, api_key):
        base_url = "https://maps.googleapis.com/maps/api/staticmap"
        params = {
            'center': f'{center[0]},{center[1]}',
            'zoom': 14,
            'size': '800x800',
            'maptype': 'satellite',
            'key': api_key
        }

        marker_strings = []
        for marker in markers:
            marker_string = f"color:{marker['color']}|label:{marker['label']}|{marker['location'][0]},{marker['location'][1]}"
            marker_strings.append(marker_string)
        params['markers'] = marker_strings
        response = requests.get(base_url, params=params)
        return response.url

    def save_map_image(map_url, filename):
        response = requests.get(map_url)
        try:
            img = Image.open(BytesIO(response.content))
            img.save(filename)
            print(f"Map image saved as '{filename}'")
        except UnidentifiedImageError as e:
            print("Failed to identify image file. Response content:")
            print(response.content)

    # Define colors and labels for each category
    category_styles = {
        'hospital': {'color': 'green', 'label': 'H'},
        'bankATM': {'color': 'purple', 'label': 'A'},
        'gas': {'color': 'yellow', 'label': 'G'},
        'shopping_mall': {'color': 'orange', 'label': 'M'},
        'park': {'color': 'red', 'label': 'P'},
        'school': {'color': 'gray', 'label': 'S'},
        'train': {'color': 'brown', 'label': 'T'},
        'airport': {'color': 'black', 'label': 'F'},
        'bus': {'color': 'red', 'label': 'B'}
    }

    location = (latitude, longitude)
    markers = [{'color': 'blue', 'label': 'C', 'location': location}]  # Center marker

    # Only include selected categories
    for category in selected_categories:
        types = categories.get(category, [])
        radius = radius_3000 if category == 'bankATM' else radius_5000
        all_places = []

        for type_item in types:
            print(f"Fetching places for {type_item} in category {category} with radius {radius}m...")
            nearby_places = nearby_search(location, [type_item], radius, api_key)
            if nearby_places:
                for place in nearby_places.get('places', []):
                    distance_value = get_distance(location, place['location'], units, api_key)
                    
                    if distance_value and distance_value <= max_dist * 1000:
                        all_places.append({
                            'name': place['displayName']['text'],
                            'distance_value': distance_value,
                            'location': (place['location']['latitude'], place['location']['longitude']),
                            'type': type_item
                        })

        # Sort places by distance and select the closest 3
        closest_places = sorted(all_places, key=lambda x: x['distance_value'])[:3]
        # print(closest_places)
        # Add markers for the closest 3 places with category-specific colors and labels
        for place in closest_places:
            category_style = category_styles.get(category, {'color': 'red', 'label': category[0].upper()})
            markers.append({
                'color': category_style['color'],
                'label': category_style['label'],
                'location': place['location']
            })
        

    # Generate the satellite map URL with markers

    
    map_url = generate_map_url(location, markers, api_key)

    # Save the satellite map image
    map_filename = fr"C:\Users\HardikBhardwaj\Documents\GitHub\Indostar\indostarDashboard-Frontend\public\map_image_{latitude:.6f}_{longitude:.6f}.png"
    save_map_image(map_url, map_filename)


@csrf_exempt
def get_mongo_collection(collection_name):
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    collection = db[collection_name]
    return collection


@csrf_exempt
def fetch_data_from_collection(collection_name):
    collection = get_mongo_collection(collection_name)
    data = list(collection.find())  # Fetch all documents in the collection
    return data


@csrf_exempt
def example_api(request):

    data = fetch_data_from_collection('baseData')

    def convert_for_json(data):
        # Convert _id to string and handle NaN values
        for item in data:
            # Convert MongoDB ObjectId to string
            if "_id" in item:
                item["_id"] = str(item["_id"])

            # Convert NaN to None (valid JSON format)
            for key, value in item.items():
                if isinstance(value, float) and pd.isna(value):  # Check for NaN values
                    item[key] = None
        return data

    data = convert_for_json(data)


    

    return JsonResponse(data, safe=False)



@csrf_exempt
def save_map_image(map_url, filename):
    response = requests.get(map_url)
    try:
        img = Image.open(BytesIO(response.content))
        img.save(filename)
        print(f"Map image saved as '{filename}'")
    except UnidentifiedImageError as e:
        print("Failed to identify image file. Response content:")
        print(response.content)


@csrf_exempt
def generate_map_from_places(latitude, longitude, raw_places_data, selected_categories, api_key):
    category_styles = {
    'hospital': {'color': 'green', 'label': 'H'},
    'bankATM': {'color': 'purple', 'label': 'A'},
    'gas': {'color': 'yellow', 'label': 'G'},
    'shopping_mall': {'color': 'orange', 'label': 'M'},
    'park': {'color': 'red', 'label': 'P'},
    'school': {'color': 'gray', 'label': 'S'},
    'train': {'color': 'brown', 'label': 'T'},
    'airport': {'color': 'black', 'label': 'F'},
    'bus': {'color': 'blue', 'label': 'B'}
}
    # Location of the center (use lat, lon from store_nearby_places_data)
    location = (latitude, longitude)
    markers = [{'color': 'blue', 'label': 'C', 'location': location}]  # Center marker

    # Loop through the selected categories
    for category in selected_categories:
        if category in raw_places_data:
            category_style = category_styles.get(category, {'color': 'red', 'label': category[0].upper()})

            # Get the places for the category
            all_places = raw_places_data[category]
            
            # Sort places by distance and select the closest 3
            closest_places = sorted(all_places, key=lambda x: x['distance_value'])[:3]

            # Add markers for the closest 3 places with category-specific colors and labels
            for place in closest_places:
                markers.append({
                    'color': category_style['color'],
                    'label': category_style['label'],
                    'location': (place['place_lat'], place['place_lon'])  # Ensure tuple format
                })

    def generate_map_url(center, markers, api_key):
        base_url = "https://maps.googleapis.com/maps/api/staticmap"
        params = {
            'center': f'{center[0]},{center[1]}',
            'zoom': 14,
            'size': '1900x800',
            'maptype': 'satellite',
            'key': api_key
        }

        marker_strings = []
        for marker in markers:
            marker_string = f"color:{marker['color']}|label:{marker['label']}|{marker['location'][0]},{marker['location'][1]}"
            marker_strings.append(marker_string)
        params['markers'] = marker_strings
        response = requests.get(base_url, params=params)
        return response.url

    # Generate the satellite map URL with markers
    map_url = generate_map_url(location, markers, api_key)

    # Save the satellite map image
    map_filename = fr"C:\Users\HardikBhardwaj\Documents\GitHub\Indostar\indostarDashboard-Frontend\public\map_image_{latitude:.6f}_{longitude:.6f}.png"
    save_map_image(map_url, map_filename)


@csrf_exempt
def upload_pdf(request):
    if request.method == 'POST':
        pdf_file = request.FILES.get('pdf')
        if pdf_file:
            # Define upload path
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)  # Ensure the directory exists
            upload_path = os.path.join(upload_dir, pdf_file.name)

            # Save the file
            with open(upload_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)

            # Extract form data and PDF latitude/longitude
            data_to_save = request.POST.dict()  # Add form data
            lat_lon_array = extract_lat_lon_from_pdf(upload_path)

            # Check for latitude and longitude in form data
            if "Latitude" not in data_to_save or not data_to_save["Latitude"]:
                data_to_save["Latitude"] = lat_lon_array[0] if lat_lon_array else None

            if "Longitude" not in data_to_save or not data_to_save["Longitude"]:
                data_to_save["Longitude"] = lat_lon_array[1] if lat_lon_array else None

            # Add the current date
            data_to_save["creation_date"] = datetime.now().strftime("%d-%B-%Y")  # Format: 23-November-2024

            # Ensure both Latitude and Longitude are present before saving
            if data_to_save["Latitude"] and data_to_save["Longitude"]:
                client = MongoClient(MONGO_URI)
                db = client[MONGO_DB_NAME]
                collection = db['baseData']

                # Check for duplicates based on Latitude and Longitude
                existing_entry = collection.find_one({
                    "Latitude": data_to_save["Latitude"],
                    "Longitude": data_to_save["Longitude"]
                })

                if existing_entry:
                    return JsonResponse({
                        'message': 'An entry with the same Latitude and Longitude already exists.',
                        'save': False
                    })

                # Add filename to data
                data_to_save["Filename"] = pdf_file.name  # Add the file path

                # Save to MongoDB
                collection.insert_one(data_to_save)
                return JsonResponse({'message': 'File uploaded and data saved successfully', 'save': True})
            else:
                return JsonResponse({
                    'message': 'Please Enter Latitude and Longitude manually',
                    'save': False
                })

        return JsonResponse({'error': 'No file provided'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


@csrf_exempt
def extraction_from_pdf(request):
    pdf_file = request.FILES.get('pdf')
    if pdf_file:
            # Define upload path
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)  # Ensure the directory exists
            upload_path = os.path.join(upload_dir, pdf_file.name)

            # Save the file
            with open(upload_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)

           
            lat_lon_array = extract_lat_lon_from_pdf(upload_path)
            try:
                if(lat_lon_array==False):
                    return(JsonResponse({'latitude':None, 'longitude':None}))
            except:None
               
            latitude=lat_lon_array[0]
            longitude=lat_lon_array[1]
            print(latitude,longitude)
            return JsonResponse({'latitude':latitude, 'longitude':longitude})



@csrf_exempt
def get_google_data(request):
    # Define all possible categories

    if request.method == 'POST':
        # Parse JSON data from the request body
        data = json.loads(request.body)
            
        # Process the data as needed
        selected_amenities = data.get('amenity', [])

        latitude=float(data.get('Lat', None))
        longitude= float(data.get('Long', None))
        raw_places_data=data.get('raw_places_data',{})


        
        # Here you could save to the database or perform other actions
        
    #     return Response({"message": "Amenities received", "data": selected_amenities}, status=status.HTTP_200_OK)
        # return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)
        categories = {
            'hospital': ["hospital", "doctor", "pharmacy"],
            'bankATM': ["atm", "bank"],
            'gas': ["gas_station"],
            'shopping_mall': ["shopping_mall"],
            'park': ["park"],
            'school': ["primary_school", "secondary_school", "university"],
            'train': ["train_station"],
            'airport': ["airport"],
            'bus': ["bus_station"]
        }

        # List of categories to include in the map
        selected_categories = selected_amenities  # Customize as needed

        # Parameters for the function call
        radius_5000 = 5000
        radius_3000 = 3000
        units = "metric"
        max_dist = 25  # 25 km
        # print(type(latitude), longitude)
        generate_map_from_places(latitude, longitude, raw_places_data, selected_categories, Api_key)
        # Call the function with latitude, longitude, and selected categories
        # generate_nearby_places_map(latitude, longitude, selected_categories, categories, radius_5000, radius_3000, units, max_dist, Api_key)
        return JsonResponse({'message': 'Success'})


@csrf_exempt
def login_view(request):
    # Parse the request body
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    # Authenticate the user
    user = authenticate(request, username=username, password=password)
    print(username, password)

    if user is not None:
        login(request, user)  # Create a session
        
        # Serialize user information
        user_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            # Add other fields as needed
        }

        return JsonResponse({'message': 'Login successful', 'user': user_data}, status=200)
    else:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)


@csrf_exempt
def save_comment(request):
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    collection = db['baseData']
    if request.method == "POST":
        try:
            # Parse the request body
            data = json.loads(request.body)
            comment = data.get("comment")
            selected_deal = data.get("selectedDeal", {})
            latitude = selected_deal.get("Latitude")
            longitude = selected_deal.get("Longitude")
            username = data.get("username")

            if not comment or not latitude or not longitude:
                return JsonResponse({"message": "Invalid data provided"}, status=400)

            # Find the document by latitude and longitude
            query = {
                "Latitude": latitude,
                "Longitude": longitude,
            }

            # Update the comment field, upsert ensures document is created if it doesn't exist
            update = {"$set": {"comment": comment,"username": username}}
            result = collection.update_one(query, update, upsert=True)

            if result.matched_count > 0:
                message = "Comment updated successfully."
            elif result.upserted_id:
                message = "Comment added to a new document."

            return JsonResponse({"message": message}, status=200)
        except Exception as e:
            return JsonResponse({"message": "An error occurred", "error": str(e)}, status=500)
    return JsonResponse({"message": "Method not allowed"}, status=405)


@csrf_exempt
def fetch_city_state_pincode(request):
    import googlemaps
    if request.method == 'POST':
        # Parse JSON data from the request body
        data = json.loads(request.body)
        latitude=float(data.get('Lat', None))
        longitude= float(data.get('Long', None))

        # Initialize the Google Maps API client
        gmaps = googlemaps.Client(key="AIzaSyCW2KbJR_ECwHKYd9H_v_su1-MCakvfNcY")

    
        result = gmaps.reverse_geocode((latitude, longitude))
    

        # Example response (you can replace this with the actual API call result)
        response = result[0]['formatted_address']

        # Parse the address to extract city, state, and pincode
        def parse_address(address):
            parts = address.split(",")
            # Ensure there are enough parts in the address
            if len(parts) >= 4:
                city = parts[-3].strip()  # City is the third last part
                state = parts[-2].strip()  # State is the second last part
                pincode = ''.join(filter(str.isdigit, state))  # Extract digits from state for pincode
                state = state.split()[0]  # Remove pincode from state
                return city, state, pincode
            return None, None, None

        city, state, pincode = parse_address(response)

        return JsonResponse({'city':city, 'state':state, 'pincode':pincode})