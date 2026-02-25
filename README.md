# 🛍️ VOGUE FIND - AI-Powered Fashion Image Retrieval System

![Vogue Find Banner](docs/banner.png) *(Illustrative: Feel free to add an actual project banner here)*

VOGUE FIND is an advanced, full-stack fashion e-commerce platform that allows users to find clothing items simply by uploading a picture. Driven by Deep Learning and modern database technologies, the system instantly matches user-uploaded photos against thousands of products using visual feature similarity.

---

## ✨ Key Features

*   **🔍 AI Visual Search**: Upload an outfit image, and the system uses a **ResNet50** Deep Learning model to extract 2048-dimensional features, finding visually identical or highly similar products in milliseconds.
*   **🛒 Full E-commerce Experience**: Browsing trending collections, adding products to the shopping cart, submitting product ratings, and reviewing purchase histories.
*   **🏢 Brand Dashboard**: Dedicated portal for fashion brands/shop owners to upload new merchandise, toggle product availability, and track catalog statistics.
*   **🔐 Authentication & Authorization**: Roles-based access control distinguishing between normal `user` and `brand` accounts.
*   **⚙️ Configurable AI Thresholds**: Easily tune the strictness of the AI search directly from the backend configurations to avoid "trash" results.

---

## 🏗️ Technical Architecture & Stack

The project relies on a robust architecture cleanly separating the UI, API layer, relational data, vector search, and object storage.

### 🎨 Frontend
*   **Framework**: React 18, Vite
*   **Styling**: Tailwind CSS, PostCSS
*   **Animation**: Framer Motion, Tailwindcss-animate
*   **UI Components**: Radix UI, Lucide React (Icons), Sonner (Toasts)
*   **Routing**: React Router DOM v6

### ⚙️ Backend
*   **Framework**: FastAPI (Python 3.9+)
*   **Server**: Uvicorn (running on `http://localhost:8080`)
*   **AI Model**: PyTorch, Pre-trained **ResNet50** 

### 🗄️ Databases & Storage
*   **🐘 PostgreSQL** (`localhost:5433`): Relational database storing user credentials, product metadata (price, color, category, name), search histories, and carts.
*   **🟣 Milvus** (`localhost:19530`): Specialized Vector Database responsible for heavy-lifting similarity search operations (L2 distance / Cosine Similarity) on extracted image embeddings.
*   **🪣 MinIO** (`localhost:9000`): S3-compatible Object Storage for saving all media assets.
    *   `image` bucket: Houses the master product catalog images.
    *   `user-queries` bucket: Temporarily/Permanently stores images uploaded by users for searching.

---

## 📁 Project Structure

```text
image_retrieval/
├── frontend-react/         # React Frontend source code
│   ├── src/
│   │   ├── components/     # UI Components (Cards, Modals, Navbar)
│   │   ├── context/        # React Context (AuthContext)
│   │   ├── pages/          # Full page views (Home, Brand, Cart, Login)
│   │   └── services/       # Axios API integration
│   └── package.json        
├── src/                    # FastAPI Backend source code
│   ├── app/                
│   │   ├── app.py          # Application entry point and CORS setup
│   │   └── routers/        # API Controller endpoints (auth, search, cart...)
│   ├── core/               
│   │   ├── database/       # DB Clients (milvus_client.py, postgres_client.py)
│   │   ├── models/         # ResNet50 feature_extractor.py
│   │   └── services/       # Core business logic (auth, search, brand management)
│   └── utils/
│       └── constants.py    # System configs, Ports, and SIMILARITY_THRESHOLD
├── venv/                   # Python Virtual Environment
├── start_all.bat           # Macro script to boot frontend + backend
├── start_backend.bat       # Startup script for FastAPI Server
└── start_frontend.bat      # Startup script for Vite React app
```

---

## 🚀 Getting Started

### Prerequisites
Make sure your system has the following running before starting the servers:
1. Python 3.9 or higher.
2. Node.js (v18+) and npm.
3. **Docker** (recommended) to easily spin up local instances for:
   - PostgreSQL (Port `5433`)
   - Milvus (Port `19530`)
   - MinIO (Port `9000`)

### 1. Setup Backend
```bash
# Clone the repository and navigate into the folder
cd image_retrieval

# Create virtual environment if it doesn't exist
python -m venv venv
# Activate virtual environment (Windows)
call venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare the Dataset (Required)
The system requires an initial dataset of fashion images to build the database index.
1. Download the [Fashion Product Images Small](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small) dataset from Kaggle.
2. Extract the downloaded archive.
3. Move the `images` folder and the `styles.csv` file into the following directory inside the project:
   ```text
   src/core/storage/data/
   ```
4. Run the ETL Pipeline to build the database, extract visual features, and populate Milvus and PostgreSQL:
   ```bash
   python -m scripts.etl_pipeline
   ```
   *Note: This process might take several minutes depending on your hardware since it uses deep learning to process thousands of images.*

### 3. Setup Frontend
```bash
cd frontend-react
npm install
```

### 4. Running the Application (Windows Environment)

The repository provides handy `.bat` scripts for quick boot-up on Windows machines:

*   **Option A**: Run everything simultaneously.
    ```bash
    ./start_all.bat
    ```
    *This will open two terminal windows handling the processes independently.*

*   **Option B**: Run them individually.
    ```bash
    # Terminal 1: Starts the API server on http://localhost:8080
    ./start_backend.bat
    
    # Terminal 2: Starts the Web UI on http://localhost:5173
    ./start_frontend.bat
    ```

---

## 🧠 Tuning AI Sensitivity
If the AI search returns results that aren't matching well, you can adjust the strictness of the Search Threshold.
1. Open `src/utils/constants.py`.
2. Find `SIMILARITY_THRESHOLD`.
3. Increase the value (e.g., `0.90`) for stricter identical matching, or lower it (e.g., `0.40`) for broader stylistic matching.
4. Restart the backend service (`start_backend.bat`).

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

> Built with ❤️ by the Vogue Find Development Team.
