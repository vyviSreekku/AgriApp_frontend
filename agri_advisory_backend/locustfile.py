from locust import HttpUser, task, between
import random


# Set this to your backend base URL when running Locust, e.g.
#   locust -H http://127.0.0.1:8000
# or override in the web UI.


class CommunityUser(HttpUser):
    """Simulates usage of the community features (posts, likes, comments)."""

    wait_time = between(1, 3)

    @task(3)
    def list_posts(self):
        # List posts with pagination
        offset = random.choice([0, 20, 40])
        limit = random.choice([10, 20])
        self.client.get(
            "/community/posts",
            params={"offset": offset, "limit": limit},
            name="GET /community/posts",
        )

    @task(1)
    def get_single_post(self):
        # Assuming there are posts with IDs 1..50; adjust if needed
        post_id = random.randint(1, 50)
        self.client.get(
            f"/community/posts/{post_id}",
            name="GET /community/posts/{post_id}",
        )


class CropAndFertilizerUser(HttpUser):
    """Simulates requests to crop recommendation and fertilizer APIs."""

    wait_time = between(1, 3)

    @task(2)
    def recommend_crop(self):
        payload = {
            "nitrogen": random.uniform(0, 150),
            "phosphorus": random.uniform(0, 100),
            "potassium": random.uniform(0, 100),
            "rainfall": random.uniform(500, 2500),
            "temperature": random.uniform(15, 35),
            "soil_ph": random.uniform(5.5, 8.0),
        }
        self.client.post(
            "/crops/recommend",
            json=payload,
            name="POST /crops/recommend",
        )

    @task(2)
    def recommend_fertilizer(self):
        payload = {
            "crop": random.choice(["rice", "wheat", "maize", "tomato"]),
            "nitrogen": random.uniform(0, 150),
            "phosphorus": random.uniform(0, 100),
            "potassium": random.uniform(0, 100),
            "soil_ph": random.uniform(5.5, 8.0),
            "rainfall": random.uniform(500, 2500),
        }
        self.client.post(
            "/fertilizer/recommend",
            json=payload,
            name="POST /fertilizer/recommend",
        )


class WeatherAndMarketUser(HttpUser):
    """Simulates calls to weather and market endpoints."""

    wait_time = between(1, 3)

    @task(3)
    def current_weather(self):
        # Use the same coordinates you use in the app
        lat, lon = 11.6973651, 75.573269
        self.client.get(
            "/weather/current",
            params={"lat": lat, "lon": lon},
            name="GET /weather/current",
        )

    @task(2)
    def weather_forecast(self):
        lat, lon = 11.6973651, 75.573269
        self.client.get(
            "/weather/forecast",
            params={"lat": lat, "lon": lon, "days": 4},
            name="GET /weather/forecast",
        )

    @task(1)
    def market_prices_sample(self):
        # Unfiltered sample
        self.client.get("/prices", name="GET /prices")

    @task(1)
    def market_prices_filtered(self):
        self.client.get(
            "/prices",
            params={"state": "Kerala", "crop": "Rice"},
            name="GET /prices?state&crop",
        )


class ChatbotUser(HttpUser):
    """Simulates the chatbot/offline RAG usage via backend endpoints."""

    wait_time = between(2, 5)

    @task(1)
    def chatbot_health(self):
        self.client.get("/chatbot/health", name="GET /chatbot/health")

    @task(1)
    def chatbot_query(self):
        question = random.choice([
            "How to control Yellow stem borer in Rice?",
            "Preventive measures for Paddy gall midge",
            "Management of Fire Blight in Apple",
            "How to treat Potato Early Blight",
        ])
        self.client.post(
            "/chatbot/query",
            json={"question": question},
            name="POST /chatbot/query",
        )

    @task(1)
    def offline_rag_bundle(self):
        # This is a heavy endpoint; keep frequency low
        self.client.get(
            "/chatbot/offline-rag-bundle",
            name="GET /chatbot/offline-rag-bundle",
        )


class ImageAnalysisUser(HttpUser):
    """Simulates image-based endpoints (pest, weed, soil, soil-ph)."""

    wait_time = between(3, 6)

    def _dummy_image(self):
        # Small dummy PNG header to satisfy content-type expectations
        return b"\x89PNG\r\n\x1a\n" + b"0" * 1024

    @task(1)
    def pest_detect(self):
        files = {"image": ("pest.png", self._dummy_image(), "image/png")}
        self.client.post(
            "/pest/detect",
            files=files,
            name="POST /pest/detect",
        )

    @task(1)
    def weed_detect(self):
        files = {"image": ("weed.png", self._dummy_image(), "image/png")}
        self.client.post(
            "/weed/detect",
            files=files,
            name="POST /weed/detect",
        )

    @task(1)
    def soil_analyze(self):
        files = {"image": ("soil.png", self._dummy_image(), "image/png")}
        self.client.post(
            "/soil/analyze",
            files=files,
            name="POST /soil/analyze",
        )

    @task(1)
    def soil_ph_analyze(self):
        files = {"image": ("soil_ph.png", self._dummy_image(), "image/png")}
        self.client.post(
            "/soil-ph/analyze",
            files=files,
            name="POST /soil-ph/analyze",
        )
