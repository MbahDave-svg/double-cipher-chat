from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

users = []
messages = []


@app.route("/")
def register_page():
    return render_template("register.html")


@app.route("/chat")
def chat_page():
    return render_template("chat.html")


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()

    if not username:
        return jsonify({"message": "Username is required"}), 400

    if username in users:
        return jsonify({"message": "Username already exists"}), 400

    users.append(username)
    return jsonify({"message": f"{username} registered successfully"})


@app.route("/users", methods=["GET"])
def get_users():
    return jsonify(users)


@app.route("/send", methods=["POST"])
def send_message():
    data = request.get_json()

    sender = data.get("sender", "").strip()
    receiver = data.get("receiver", "").strip()
    encrypted_message = data.get("encrypted_message", "").strip()

    if not sender or not receiver or not encrypted_message:
        return jsonify({"message": "Missing fields"}), 400

    messages.append({
        "sender": sender,
        "receiver": receiver,
        "encrypted_message": encrypted_message
    })

    return jsonify({"message": "Message sent successfully"})


@app.route("/messages/<username>", methods=["GET"])
def get_messages(username):
    user_messages = [msg for msg in messages if msg["receiver"] == username]
    return jsonify({"messages": user_messages})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)