# Local Kafka Setup

This project saves a complaint first, publishes the complaint ID to Kafka, and then lets the ML worker call your Hugging Face Space asynchronously.

## Where to keep Kafka files

Store local infrastructure files inside the repo under `infra/kafka-local/`.

Why this location:

- keeps Kafka setup versioned with the project
- avoids mixing infrastructure files into `backend/` or `frontend/`
- makes it clear this is local development infrastructure

## Files used

- Kafka compose file: `infra/kafka-local/docker-compose.yml`
- Backend Kafka toggle: `backend/src/main/resources/application-dev.yml`
- Internal ML callback key: `APP_INTERNAL_API_KEY`

## Topic used by this project

The backend publishes to:

- `complaint-classification`

## Start Kafka locally

From the project root:

```powershell
docker compose -f infra/kafka-local/docker-compose.yml up -d
```

Check containers:

```powershell
docker ps
```

Expected containers:

- `railway-zookeeper`
- `railway-kafka`

## Verify Kafka is running

List topics:

```powershell
docker exec -it railway-kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

Create the project topic if needed:

```powershell
docker exec -it railway-kafka kafka-topics.sh --create --topic complaint-classification --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

## Run the backend with Kafka enabled

From `backend/`:

```powershell
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Important environment values for local development:

```powershell
$env:APP_KAFKA_ENABLED = "true"
$env:KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
```

You can set them before starting the backend:

```powershell
$env:APP_KAFKA_ENABLED = "true"
$env:KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

## Test the publish flow

Open a Kafka consumer:

```powershell
docker exec -it railway-kafka kafka-console-consumer.sh --topic complaint-classification --from-beginning --bootstrap-server localhost:9092
```

Then create a complaint from the frontend or backend API.

Expected result:

- the backend saves the complaint immediately
- Kafka receives the complaint ID as a message
- the ML worker reads the ID
- the ML worker calls your Hugging Face Space
- the backend complaint record is updated later with department and urgency

## Stop Kafka

```powershell
docker compose -f infra/kafka-local/docker-compose.yml down
```

To remove stored Kafka data too:

```powershell
docker compose -f infra/kafka-local/docker-compose.yml down -v
```

## Current limitation

To run the full async pipeline locally, start the AI service with:

```powershell
cd ai-service
pip install -r requirements.txt
$env:KAFKA_ENABLED = "true"
$env:KAFKA_BROKER = "localhost:9092"
$env:KAFKA_TOPIC = "complaint-classification"
$env:BACKEND_URL = "http://localhost:8081"
$env:BACKEND_INTERNAL_KEY = "railway-internal-key"
$env:CLASSIFIER_URL = "https://midhun-2542-railwaymodel.hf.space/classify"
uvicorn main:app --reload --port 8000
```
