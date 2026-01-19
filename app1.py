from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import base64
from werkzeug.utils import secure_filename
import google.generativeai as genai
from datetime import datetime

app = Flask(__name__)
app.config['STATIC_FOLDER'] = 'static'
CORS(app)

# -------- CONFIG --------
UPLOAD_FOLDER = "static/images"
ITEMS_FILE = "found_items.json"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create static/images folder if needed
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Gemini (set your API key here or via environment variable)
# Get API key from: https://aistudio.google.com/app/apikeys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE")
if GEMINI_API_KEY != "YOUR_API_KEY_HERE":
    genai.configure(api_key=GEMINI_API_KEY)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def load_items():
    """Load items from JSON file"""
    if os.path.exists(ITEMS_FILE):
        with open(ITEMS_FILE, 'r') as f:
            return json.load(f)
    return []


def save_items(items):
    """Save items to JSON file"""
    with open(ITEMS_FILE, 'w') as f:
        json.dump(items, f, indent=2)


def get_ai_suggestion(description, place):
    """Get Gemini AI suggestion for matching/categorizing found item"""
    try:
        if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
            return "AI suggestion: [Gemini would analyze this item]"
        
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""A student found an item on campus. Help identify what category it belongs to and suggest who might be looking for it.

Item Description: {description}
Place Found: {place}

Provide a brief, helpful response (1-2 sentences) that:
1. Categorizes the item (e.g., Electronics, Keys, Clothing, etc.)
2. Suggests what to do with it

Be friendly and concise."""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return "AI suggestion: [Gemini would analyze this item]"


@app.route("/")
def home():
    return jsonify({"message": "Campus Lost & Found Backend - Ready!", "status": "running"})


# -------- POST: Add Found Item --------
@app.route("/api/items", methods=["POST"])
def add_found_item():
    """
    Submit a found item with image, description, location, and details.
    Expected form data:
    - description: text description (what is it)
    - location: where it was found
    - itemDescription: details about the object (color, material, etc.)
    - image: image file (optional)
    """
    try:
        description = request.form.get("description", "").strip()
        location = request.form.get("location", "").strip()
        item_description = request.form.get("itemDescription", "").strip()
        image_file = request.files.get("image")

        if not description or not location:
            return jsonify({"error": "Description and location are required"}), 400

        # Handle image upload
        image_filename = None
        if image_file and allowed_file(image_file.filename):
            filename = secure_filename(image_file.filename)
            # Add timestamp to avoid conflicts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
            filename = timestamp + filename
            image_file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            image_filename = filename

        # Get AI suggestion
        ai_suggestion = get_ai_suggestion(description, location)

        # Create item
        item = {
            "id": datetime.now().timestamp(),
            "description": description,
            "location": location,
            "itemDescription": item_description,
            "image": image_filename,
            "timestamp": datetime.now().isoformat(),
            "ai_suggestion": ai_suggestion
        }

        # Save to file
        items = load_items()
        items.append(item)
        save_items(items)

        return jsonify({
            "message": "Item added successfully!",
            "item": item
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- GET: Fetch All Found Items --------
@app.route("/api/items", methods=["GET"])
def get_found_items():
    """
    Fetch all found items.
    Returns a list of items with their details and AI suggestions.
    """
    try:
        items = load_items()
        # Sort by timestamp (newest first)
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- DELETE: Remove Found Item --------
@app.route("/api/items/<float:item_id>", methods=["DELETE"])
def delete_found_item(item_id):
    """
    Delete a found item by ID.
    Also removes the associated image file if it exists.
    """
    try:
        items = load_items()
        
        # Find and remove item
        item_to_delete = None
        for i, item in enumerate(items):
            if item["id"] == item_id:
                item_to_delete = items.pop(i)
                break
        
        if not item_to_delete:
            return jsonify({"error": "Item not found"}), 404
        
        # Delete associated image if it exists
        if item_to_delete.get("image"):
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], item_to_delete["image"])
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Warning: Could not delete image {item_to_delete['image']}: {e}")
        
        # Save updated items list
        save_items(items)
        
        return jsonify({"message": "Item deleted successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------- GET: Serve uploaded images --------
@app.route("/static/images/<filename>")
def serve_image(filename):
    """Serve uploaded images from static/images folder"""
    try:
        full_path = os.path.join('static', 'images')
        print(f"Serving image: {filename} from {full_path}")
        print(f"File exists: {os.path.exists(os.path.join(full_path, filename))}")
        return send_from_directory(full_path, filename)
    except Exception as e:
        print(f"Error serving image {filename}: {e}")
        return jsonify({"error": f"Image not found: {str(e)}"}), 404


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
