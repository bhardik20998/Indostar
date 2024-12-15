import fitz
import re
import os

def extract_lat_lon_from_pdf(pdf_path):
    def is_scanned_pdf(pdf_path):
        """Determines if the PDF is scanned or has insufficient extractable text."""
        with fitz.open(pdf_path) as doc:
            total_lines = 0
            for page in doc:
                text = page.get_text()
                if text.strip():
                    lines = text.splitlines()
                    total_lines += len(lines)
            return total_lines < 50
    if is_scanned_pdf(pdf_path):
        return False

    def dms_to_decimal(degrees, minutes, seconds, direction):
        """Convert DMS (Degrees, Minutes, Seconds) to decimal degrees."""
        decimal = degrees + minutes / 60 + seconds / 3600
        if direction in ['S', 'W']:
            decimal *= -1
        return round(decimal, 4)

    # Extract text using PyMuPDF (fitz)
    text = ''
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()

    # Save the extracted text to a .txt file
    text_filename = os.path.splitext(pdf_path)[0] + '_extracted_text.txt'
    with open(text_filename, 'w', encoding='utf-8') as text_file:
        text_file.write(text)

    # Patterns for latitude and longitude extraction
    lat_pattern = r"latitude[\s\W]*[:\s]*([+-]?\d{1,2}\.\d{4,18})"
    lon_pattern = r"longitude[\s\W]*[:\s]*([+-]?\d{1,2}\.\d{4,18})"
    float_pattern = r"(\d{1,2}\.\d{5,18})"
    lat_long_comma_pattern = r"([+-]?\d{1,2}\.\d{4,18})\s*[^a-zA-Z0-9]*\s*([+-]?\d{1,3}\.\d{4,18})"
    dms_pattern_1 = r"([NS])[\s°\'\"]*(\d{1,2})[\s°\'\"]*(\d{1,2})[\s°\'\"]*(\d{1,2}(?:\.\d+)?)[\"\s]*?,?\s*([WE])[\s°\'\"]*(\d{1,3})[\s°\'\"]*(\d{1,2})[\s°\'\"]*(\d{1,2}(?:\.\d+)?)[\"\s]*?"
    dms_pattern_2 = r"(\d{1,2})[\s°\'\"]*(\d{1,2})[\s°\'\"]*(\d{1,2}(?:\.\d+)?)[\"\s]*?([NS]),?\s*(\d{1,3})[\s°\'\"]*(\d{1,2})[\s°\'\"]*(\d{1,2}(?:\.\d+)?)[\"\s]*?([WE])"

    # Initialize latitude and longitude to None
    latitude = None
    longitude = None

    # Search for latitude and longitude using various patterns
    lat_match = re.search(lat_pattern, text, re.IGNORECASE)
    lon_match = re.search(lon_pattern, text, re.IGNORECASE)

    if lat_match and lon_match:
        latitude = round(float(lat_match.group(1)), 4)
        longitude = round(float(lon_match.group(1)), 4)
    else:
        lat_long_comma_match = re.search(lat_long_comma_pattern, text)
        dms_match_1 = re.search(dms_pattern_1, text)
        dms_match_2 = re.search(dms_pattern_2, text)
        
        if dms_match_1:
            lat_deg, lat_min, lat_sec = map(float, [dms_match_1.group(2), dms_match_1.group(3), dms_match_1.group(4)])
            lon_deg, lon_min, lon_sec = map(float, [dms_match_1.group(6), dms_match_1.group(7), dms_match_1.group(8)])
            latitude = dms_to_decimal(lat_deg, lat_min, lat_sec, dms_match_1.group(1))
            longitude = dms_to_decimal(lon_deg, lon_min, lon_sec, dms_match_1.group(5))
        elif dms_match_2:
            lat_deg, lat_min, lat_sec = map(float, [dms_match_2.group(1), dms_match_2.group(2), dms_match_2.group(3)])
            lon_deg, lon_min, lon_sec = map(float, [dms_match_2.group(5), dms_match_2.group(6), dms_match_2.group(7)])
            latitude = dms_to_decimal(lat_deg, lat_min, lat_sec, dms_match_2.group(4))
            longitude = dms_to_decimal(lon_deg, lon_min, lon_sec, dms_match_2.group(8))
        elif lat_long_comma_match:
            latitude = round(float(lat_long_comma_match.group(1)), 4)
            longitude = round(float(lat_long_comma_match.group(2)), 4)
        elif len(re.findall(float_pattern, text)) >= 2:
            floats_with_specified_pattern = re.findall(float_pattern, text)
            latitude = round(float(floats_with_specified_pattern[0]), 4)
            longitude = round(float(floats_with_specified_pattern[1]), 4)

    # Swap latitude and longitude if necessary
    if latitude and longitude:
        try:
            if latitude > longitude:
                latitude, longitude = longitude, latitude
        except ValueError:
            pass  # Handle cases where conversion to float fails

    if latitude is None or longitude is None:
        return False
    else:
        return [latitude, longitude]


