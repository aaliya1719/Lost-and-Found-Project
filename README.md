

# 🏫 Campus Lost & Found

![Status](https://img.shields.io/badge/Status-Live-success)
![Tech](https://img.shields.io/badge/Tech-HTML%20|%20CSS%20|%20JS%20|%20Python-blue)

## 📖 About The Project
**Campus Lost & Found** is a web application designed to help students track lost and found items on campus. It provides a simple, clean, and responsive interface where users can:

* View a feed of found items.
* Report items they have found.
* Search for lost items by text or description.
* Get a real-time list of items stored in the backend.

---

## 💻 Tech Stack
* **Frontend:** HTML, CSS, JavaScript (DOM manipulation)
* **Backend:** Python, Flask
* **Other:** Flask-CORS for API handling

---

## 🚀 How to Run Locally
Follow these steps to get the project running on your machine:

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaliya1719/Lost-and-Found-Project.git
   cd Lost-and-Found-Project

2. **Install dependencies**
Make sure you have Python installed. Then run:
```bash
pip install flask flask-cors
```

3. **Run the backend**
```bash
python app1.py
```
Backend will run on `http://127.0.0.1:5000/` by default.

4. **Open the frontend**
Open `index.html` in your browser or serve it locally:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

5. **Test the app**
- Use the form to report found items.
- The feed should update with new items dynamically.
- Search items using the search bar.

