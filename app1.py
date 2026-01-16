from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Folder to store uploaded images
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create uploads folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# In-memory storage (acts like database)
lost_items = []
found_items = []

# ID counters
lost_id_counter = 1
found_id_counter = 1


@app.route("/")
def home():
    return "Lost & Found Backend is running!"


# -------- ADD LOST ITEM --------
@app.route("/lost", methods=["POST"])
def add_lost_item():
    global lost_id_counter

    name = request.form.get("name")
    description = request.form.get("description")
    image = request.files.get("image")

    image_filename = None
    if image:
        image_filename = secure_filename(image.filename)
        image.save(os.path.join(app.config["UPLOAD_FOLDER"], image_filename))

    item = {
        "id": lost_id_counter,
        "name": name,
        "description": description,
        "image": image_filename
    }

    lost_items.append(item)
    lost_id_counter += 1

    return jsonify({
        "message": "Lost item added successfully",
        "item": item
    })


# -------- ADD FOUND ITEM --------
@app.route("/found", methods=["POST"])
def add_found_item():
    global found_id_counter

    description = request.form.get("description")
    image = request.files.get("image")

    image_filename = None
    if image:
        image_filename = secure_filename(image.filename)
        image.save(os.path.join(app.config["UPLOAD_FOLDER"], image_filename))

    item = {
        "id": found_id_counter,
        "description": description,
        "image": image_filename
    }

    found_items.append(item)
    found_id_counter += 1

    return jsonify({
        "message": "Found item added successfully",
        "item": item
    })


# -------- LIST ALL FOUND ITEMS --------
@app.route("/found", methods=["GET"])
def get_found_items():
    return jsonify(found_items)


# -------- MATCH LOST ITEM WITH FOUND ITEMS --------
@app.route("/match/<int:lost_id>", methods=["GET"])
def match_lost_item(lost_id):
    lost_item = None

    for item in lost_items:
        if item["id"] == lost_id:
            lost_item = item
            break

    if not lost_item:
        return jsonify({"message": "Lost item not found"}), 404

    matches = []
    lost_words = lost_item["description"].lower().split()

    for found in found_items:
        found_desc = found["description"].lower()
        for word in lost_words:
            if word in found_desc:
                matches.append(found)
                break

    return jsonify({
        "lost_item": lost_item,
        "matches": matches
    })

# Route to get all lost items
@app.route('/api/items',methods=['GET'])
def get_items():
    return jsonify(lost_items)

@app.route('/api/report',methods=['POST'])
def report_items():
    data = request.json
    lost_items.append(data) #Adding the new item to the list
    return jsonify({"message": "Item reported succesfully!", "item":data}) 

if __name__ == "__main__":
    app.run(debug=True)
